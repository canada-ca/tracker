const dotenv = require('dotenv-safe')
dotenv.config()

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

  describe('get the yearly dmarc report information', () => {
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
            yearlyDmarcSummaries: [
              {
                startDate: '2019-01-01',
                endDate: '2019-01-31',
              },
              {
                startDate: '2019-02-01',
                endDate: '2019-02-28',
              },
              {
                startDate: '2019-03-01',
                endDate: '2019-03-31',
              },
              {
                startDate: '2019-04-01',
                endDate: '2019-04-30',
              },
              {
                startDate: '2019-05-01',
                endDate: '2019-01-31',
              },
              {
                startDate: '2019-06-01',
                endDate: '2019-06-30',
              },
              {
                startDate: '2019-07-01',
                endDate: '2019-07-31',
              },
              {
                startDate: '2019-08-01',
                endDate: '2019-08-31',
              },
              {
                startDate: '2019-09-01',
                endDate: '2019-09-30',
              },
              {
                startDate: '2019-10-01',
                endDate: '2019-10-31',
              },
              {
                startDate: '2019-11-01',
                endDate: '2019-11-30',
              },
              {
                startDate: '2019-12-01',
                endDate: '2019-12-31',
              },
              {
                startDate: '2020-01-01',
                endDate: '2020-01-31',
              },
            ],
          },
        })

        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                yearlyDmarcSummaries {
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
              checkDomainPermission: checkDomainPermission({query, userId: user._key}),
              checkDomainOwnership: checkDomainOwnership({query, userId: user._key}),
              tokenize,
              userRequired,
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
              yearlyDmarcSummaries: [
                {
                  month: '1',
                  year: '2019',
                },
                {
                  month: '2',
                  year: '2019',
                },
                {
                  month: '3',
                  year: '2019',
                },
                {
                  month: '4',
                  year: '2019',
                },
                {
                  month: '5',
                  year: '2019',
                },
                {
                  month: '6',
                  year: '2019',
                },
                {
                  month: '7',
                  year: '2019',
                },
                {
                  month: '8',
                  year: '2019',
                },
                {
                  month: '9',
                  year: '2019',
                },
                {
                  month: '10',
                  year: '2019',
                },
                {
                  month: '11',
                  year: '2019',
                },
                {
                  month: '12',
                  year: '2019',
                },
                {
                  month: '1',
                  year: '2020',
                },
              ],
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
              startDate: '',
              endDate: '',
            },
          },
        })

        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                yearlyDmarcSummaries {
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
              checkDomainPermission: checkDomainPermission({query, userId: user._key}),
              checkDomainOwnership: checkDomainOwnership({query, userId: user._key}),
              tokenize,
              userRequired,
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
