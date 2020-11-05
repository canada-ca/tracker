const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const bcrypt = require('bcrypt')
const moment = require('moment')

const { cleanseInput } = require('../validators')
const {
  checkDomainPermission,
  checkDomainOwnership,
  tokenize,
  userRequired,
} = require('../auth')
const {
  domainLoaderByDomain,
  userLoaderByUserName,
  userLoaderByKey,
} = require('../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findDomainByDomain query', () => {
  let query, drop, truncate, migrate, schema, collections, domain, org

  beforeAll(async () => {
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })

  const consoleInfoOutput = []
  const consoleWarnOutput = []
  const mockedInfo = (output) => consoleInfoOutput.push(output)
  const mockedWarn = (output) => consoleWarnOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
    await truncate()
    await graphql(
      schema,
      `
        mutation {
          signUp(
            input: {
              displayName: "Test Account"
              userName: "test.account@istio.actually.exists"
              password: "testpassword123"
              confirmPassword: "testpassword123"
              preferredLang: FRENCH
            }
          ) {
            authResult {
              user {
                id
              }
            }
          }
        }
      `,
      null,
      {
        query,
        auth: {
          bcrypt,
          tokenize,
        },
        validators: {
          cleanseInput,
        },
        loaders: {
          userLoaderByUserName: userLoaderByUserName(query),
        },
      },
    )
    consoleInfoOutput.length = 0
    consoleWarnOutput.length = 0

    org = await collections.organizations.save({
      orgDetails: {
        en: {
          slug: 'treasury-board-secretariat',
          acronym: 'TBS',
          name: 'Treasury Board of Canada Secretariat',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'secretariat-conseil-tresor',
          acronym: 'SCT',
          name: 'Secrétariat du Conseil Trésor du Canada',
          zone: 'FED',
          sector: 'TBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      lastRan: null,
      selectors: ['selector1._domainkey', 'selector2._domainkey'],
    })
    await collections.claims.save({
      _to: domain._id,
      _from: org._id,
    })
  })

  afterEach(async () => {
    await drop()
  })

  describe('get the dmarc report data by dmarcSummaryByPeriod', () => {
    describe('org has ownership to the domain', () => {
      let user
      beforeEach(async () => {
        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
        await collections.ownership.save({
          _to: domain._id,
          _from: org._id,
        })
      })

      afterEach(async () => {
        await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
        await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
      })
      it('returns month and end', async () => {
        const dmarcReportLoader = jest.fn().mockReturnValue({
          data: {
            dmarcSummaryByPeriod: {
              startDate: '2020-01-01',
              endDate: '2020-01-31',
            },
          },
        })

        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                dmarcSummaryByPeriod(month: JANUARY, year: "2020") {
                  month
                  year
                }
              }
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
            moment,
            auth: {
              checkDomainPermission: checkDomainPermission({
                query,
                userId: user._key,
              }),
              checkDomainOwnership: checkDomainOwnership({
                query,
                userId: user._key,
              }),
              tokenize,
              userRequired: userRequired({
                userId: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              domainLoaderByDomain: domainLoaderByDomain(query),
              dmarcReportLoader,
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const expectedResponse = {
          data: {
            findDomainByDomain: {
              dmarcSummaryByPeriod: {
                month: '1',
                year: '2020',
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleInfoOutput).toEqual([
          `User ${user._key} successfully retrieved domain ${domain._key}.`,
        ])
      })
    })
    describe('org does not have ownership to the domain', () => {
      let user
      beforeEach(async () => {
        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
      })
      it('throws an error', async () => {
        const dmarcReportLoader = jest.fn().mockReturnValue({
          data: {
            dmarcSummaryByPeriod: {
              startDate: '2020-01-01',
              endDate: '2020-01-01',
            },
          },
        })

        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                dmarcSummaryByPeriod(month: JANUARY, year: "2020") {
                  month
                  year
                }
              }
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
            moment,
            auth: {
              checkDomainPermission: checkDomainPermission({
                query,
                userId: user._key,
              }),
              checkDomainOwnership: checkDomainOwnership({
                query,
                userId: user._key,
              }),
              tokenize,
              userRequired: userRequired({
                userId: user._key,
                userLoaderByKey: userLoaderByKey(query),
              }),
            },
            validators: {
              cleanseInput,
            },
            loaders: {
              domainLoaderByDomain: domainLoaderByDomain(query),
              dmarcReportLoader,
              userLoaderByKey: userLoaderByKey(query),
            },
          },
        )

        const error = [
          new GraphQLError(
            'Unable to retrieve dmarc report information for: test.gc.ca',
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleInfoOutput).toEqual([
          `User ${user._key} successfully retrieved domain ${domain._key}.`,
        ])
        expect(consoleWarnOutput).toEqual([
          `User: ${user._key} attempted to access dmarc report period data for ${domain._key}, but does not belong to an org with ownership.`,
        ])
      })
    })
  })
})
