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

  describe('find the dmarc report dmarc fail information', () => {
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
    it('returns dmarc fail data', async () => {
      const dmarcReportLoader = jest.fn().mockReturnValue({
        data: {
          dmarcSummaryByPeriod: {
            detailTables: {
              dmarcFailure: {
                edges: [
                  {
                    cursor: 'ZmFpbERtYXJjOjE=',
                    node: {
                      disposition: 'none',
                      dkimDomains: '',
                      dkimSelectors: '',
                      dnsHost: 'test.dns.gc.ca',
                      envelopeFrom: 'test.domain.canada.ca',
                      headerFrom: 'test.domain.canada.ca',
                      id: 'ZmFpbERtYXJjOjE=',
                      sourceIpAddress: '123.456.78.91',
                      spfDomains: 'test.domain.gc.ca',
                      totalMessages: 30,
                    },
                  },
                ],
                pageInfo: {
                  startCursor: 'ZmFpbERtYXJjOjE=',
                  endCursor: 'ZmFpbERtYXJjOjE=',
                  hasNextPage: true,
                  hasPreviousPage: false,
                },
              },
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
                detailTables {
                  dmarcFailure(first: 1) {
                    edges {
                      cursor
                      node {
                        id
                        dkimDomains
                        dkimSelectors
                        disposition
                        dnsHost
                        envelopeFrom
                        headerFrom
                        sourceIpAddress
                        spfDomains
                        totalMessages
                      }
                    }
                    pageInfo {
                      startCursor
                      endCursor
                      hasNextPage
                      hasPreviousPage
                    }
                  }
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
              detailTables: {
                dmarcFailure: {
                  edges: [
                    {
                      cursor: 'ZmFpbERtYXJjOjE=',
                      node: {
                        disposition: 'none',
                        dkimDomains: '',
                        dkimSelectors: '',
                        dnsHost: 'test.dns.gc.ca',
                        envelopeFrom: 'test.domain.canada.ca',
                        headerFrom: 'test.domain.canada.ca',
                        id: 'ZmFpbERtYXJjOjE=',
                        sourceIpAddress: '123.456.78.91',
                        spfDomains: 'test.domain.gc.ca',
                        totalMessages: 30,
                      },
                    },
                  ],
                  pageInfo: {
                    startCursor: 'ZmFpbERtYXJjOjE=',
                    endCursor: 'ZmFpbERtYXJjOjE=',
                    hasNextPage: true,
                    hasPreviousPage: false,
                  },
                },
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
