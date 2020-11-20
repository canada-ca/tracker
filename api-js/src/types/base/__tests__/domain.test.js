const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../../../mutations')
const { cleanseInput } = require('../../../validators')
const { tokenize } = require('../../../auth')
const {
  orgLoaderConnectionArgsByDomainId,
  domainLoaderConnectionsByUserId,
  domainLoaderByKey,
  userLoaderByUserName,
} = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the domain connection object, and the domain object', () => {
  let query, drop, truncate, migrate, schema, collections, org, i18n

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
  })

  afterEach(async () => {
    await drop()
  })

  describe('given successful retrieval of domains', () => {
    let user, domainOne, domainTwo
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
      domainOne = await collections.domains.save({
        domain: 'test1.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
        status: {
          dkim: 'pass',
          dmarc: 'pass',
          https: 'info',
          spf: 'fail',
          ssl: 'fail',
        },
      })
      await collections.claims.save({
        _to: domainOne._id,
        _from: org._id,
      })
      await collections.claims.save({
        _to: domainTwo._id,
        _from: org._id,
      })
    })
    afterEach(async () => {
      await query`
        LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        FOR affiliation IN affiliations
          REMOVE affiliation IN affiliations
      `
      await query`
        LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userKey: e._to })
        LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
        RETURN true
      `
      await query`
        FOR claim IN claims
          REMOVE claim IN claims
      `
    })
    describe('user queries for their domains', () => {
      it('returns domains', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findMyDomains(first: 5) {
                edges {
                  cursor
                  node {
                    id
                    domain
                    lastRan
                    selectors
                    status {
                      dkim
                    }
                    organizations(first: 5) {
                      edges {
                        node {
                          id
                        }
                      }
                    }
                    email {
                      domain {
                        id
                      }
                    }
                    web {
                      domain {
                        id
                      }
                    }
                  }
                }
                pageInfo {
                  hasNextPage
                  hasPreviousPage
                  startCursor
                  endCursor
                }
                totalCount
              }
            }
          `,
          null,
          {
            i18n,
            userKey: user._key,
            loaders: {
              domainLoaderByKey: domainLoaderByKey(query, user._key),
              domainLoaderConnectionsByUserId: domainLoaderConnectionsByUserId(
                query,
                user._key,
                cleanseInput,
              ),
              orgLoaderConnectionArgsByDomainId: orgLoaderConnectionArgsByDomainId(
                query,
                'en',
                user._key,
                cleanseInput,
              ),
            },
          },
        )

        const expectedResponse = {
          data: {
            findMyDomains: {
              edges: [
                {
                  cursor: toGlobalId('domains', domainOne._key),
                  node: {
                    id: toGlobalId('domains', domainOne._key),
                    domain: 'test1.gc.ca',
                    lastRan: null,
                    selectors: ['selector1._domainkey', 'selector2._domainkey'],
                    status: {
                      dkim: 'PASS',
                    },
                    email: {
                      domain: {
                        id: toGlobalId('domains', domainOne._key),
                      },
                    },
                    web: {
                      domain: {
                        id: toGlobalId('domains', domainOne._key),
                      },
                    },
                    organizations: {
                      edges: [
                        {
                          node: {
                            id: toGlobalId('organizations', org._key),
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  cursor: toGlobalId('domains', domainTwo._key),
                  node: {
                    id: toGlobalId('domains', domainTwo._key),
                    domain: 'test2.gc.ca',
                    lastRan: null,
                    selectors: ['selector1._domainkey', 'selector2._domainkey'],
                    status: {
                      dkim: 'PASS',
                    },
                    email: {
                      domain: {
                        id: toGlobalId('domains', domainTwo._key),
                      },
                    },
                    web: {
                      domain: {
                        id: toGlobalId('domains', domainTwo._key),
                      },
                    },
                    organizations: {
                      edges: [
                        {
                          node: {
                            id: toGlobalId('organizations', org._key),
                          },
                        },
                      ],
                    },
                  },
                },
              ],
              pageInfo: {
                endCursor: toGlobalId('domains', domainTwo._key),
                hasNextPage: false,
                hasPreviousPage: false,
                startCursor: toGlobalId('domains', domainOne._key),
              },
              totalCount: 2,
            },
          },
        }
        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User ${user._key} successfully retrieved their domains.`,
        ])
      })
    })
  })
})
