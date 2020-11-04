const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema } = require('graphql')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const bcrypt = require('bcrypt')

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

  let consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeEach(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
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
    consoleOutput = []

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
    await collections.ownership.save({
      _to: domain._id,
      _from: org._id,
    })
  })

  afterEach(async () => {
    await drop()
  })

  describe('find the dmarc report category percentages for a given dmarc report period', () => {
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
    describe('category values are greater than 0', () => {
      it('returns category percentages', async () => {
        const dmarcReportLoader = jest.fn().mockReturnValue({
          data: {
            dmarcSummaryByPeriod: {
              categoryTotals: {
                fail: 10,
                fullPass: 53,
                passDkimOnly: 123,
                passSpfOnly: 135,
              },
            },
          },
        })

        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                dmarcSummaryByPeriod(month: SEPTEMBER, year: "2020") {
                  categoryPercentages {
                    failPercentage
                    fullPassPercentage
                    passDkimOnlyPercentage
                    passSpfOnlyPercentage
                    totalMessages
                  }
                }
              }
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
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
                categoryPercentages: {
                  failPercentage: 3.12,
                  fullPassPercentage: 16.51,
                  passDkimOnlyPercentage: 38.32,
                  passSpfOnlyPercentage: 42.06,
                  totalMessages: 321,
                },
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved domain ${domain._key}.`,
        ])
      })
    })
    describe('category totals are zero', () => {
      it('returns category percentages', async () => {
        const dmarcReportLoader = jest.fn().mockReturnValue({
          data: {
            dmarcSummaryByPeriod: {
              categoryTotals: {
                fail: 0,
                fullPass: 0,
                passDkimOnly: 0,
                passSpfOnly: 0,
              },
            },
          },
        })

        const response = await graphql(
          schema,
          `
            query {
              findDomainByDomain(domain: "test.gc.ca") {
                dmarcSummaryByPeriod(month: SEPTEMBER, year: "2020") {
                  categoryPercentages {
                    failPercentage
                    fullPassPercentage
                    passDkimOnlyPercentage
                    passSpfOnlyPercentage
                    totalMessages
                  }
                }
              }
            }
          `,
          null,
          {
            userId: user._key,
            query: query,
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
                categoryPercentages: {
                  failPercentage: 0,
                  fullPassPercentage: 0,
                  passDkimOnlyPercentage: 0,
                  passSpfOnlyPercentage: 0,
                  totalMessages: 0,
                },
              },
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved domain ${domain._key}.`,
        ])
      })
    })
  })
})
