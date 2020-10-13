const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { toGlobalId } = require('graphql-relay')
const bcrypt = require('bcrypt')

const { cleanseInput } = require('../validators')
const { tokenize, userRequired, checkPermission } = require('../auth')
const {
  orgLoaderBySlug,
  userLoaderByUserName,
  userLoaderByKey,
  domainLoaderConnectionsByOrgId,
} = require('../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findDomainsByOrg query', () => {
  let query, drop, truncate, migrate, schema, collections, org

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
      })
      domainTwo = await collections.domains.save({
        domain: 'test2.gc.ca',
        lastRan: null,
        selectors: ['selector1._domainkey', 'selector2._domainkey'],
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
        LET userEdges = (FOR v, e IN 1..1 ANY ${org._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
        LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
        RETURN true
      `
      await query`
        FOR affiliation IN affiliations
          REMOVE affiliation IN affiliations
      `
      await query`
        LET domainEdges = (FOR v, e IN 1..1 ANY ${org._id} claims RETURN { edgeKey: e._key, userId: e._to })
        LET removeDomainEdges = (FOR domainEdge IN domainEdges REMOVE domainEdge.edgeKey IN claims)
        RETURN true
      `
      await query`
        FOR claim IN claims
          REMOVE claim IN claims
      `
    })
    describe('user queries for domains by organization slug', () => {
      describe('in english', () => {
        it('returns organizations', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainsByOrg(orgSlug: "treasury-board-secretariat") {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              userId: user._key,
              query: query,
              auth: {
                checkPermission,
                userRequired,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                orgLoaderBySlug: orgLoaderBySlug(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findDomainsByOrg: {
                edges: [
                  {
                    cursor: toGlobalId('domains', domainOne._key),
                    node: {
                      id: toGlobalId('domains', domainOne._key),
                      domain: 'test1.gc.ca',
                      lastRan: null,
                      selectors: [
                        'selector1._domainkey',
                        'selector2._domainkey',
                      ],
                    },
                  },
                  {
                    cursor: toGlobalId('domains', domainTwo._key),
                    node: {
                      id: toGlobalId('domains', domainTwo._key),
                      domain: 'test2.gc.ca',
                      lastRan: null,
                      selectors: [
                        'selector1._domainkey',
                        'selector2._domainkey',
                      ],
                    },
                  },
                ],
                pageInfo: {
                  endCursor: toGlobalId('domains', domainTwo._key),
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', domainOne._key),
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved domains belonging to organization ${org._key}.`,
          ])
        })
      })
      describe('in french', () => {
        it('returns organizations', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainsByOrg(orgSlug: "secretariat-conseil-tresor") {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              userId: user._key,
              query: query,
              auth: {
                checkPermission,
                userRequired,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                orgLoaderBySlug: orgLoaderBySlug(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findDomainsByOrg: {
                edges: [
                  {
                    cursor: toGlobalId('domains', domainOne._key),
                    node: {
                      id: toGlobalId('domains', domainOne._key),
                      domain: 'test1.gc.ca',
                      lastRan: null,
                      selectors: [
                        'selector1._domainkey',
                        'selector2._domainkey',
                      ],
                    },
                  },
                  {
                    cursor: toGlobalId('domains', domainTwo._key),
                    node: {
                      id: toGlobalId('domains', domainTwo._key),
                      domain: 'test2.gc.ca',
                      lastRan: null,
                      selectors: [
                        'selector1._domainkey',
                        'selector2._domainkey',
                      ],
                    },
                  },
                ],
                pageInfo: {
                  endCursor: toGlobalId('domains', domainTwo._key),
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('domains', domainOne._key),
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved domains belonging to organization ${org._key}.`,
          ])
        })
      })
    })
  })
  describe('given unsuccessful retrieval of domains', () => {
    let user
    beforeEach(async () => {
      const userCursor = await query`
        FOR user IN users
          FILTER user.userName == "test.account@istio.actually.exists"
          RETURN user
      `
      user = await userCursor.next()
    })
    describe('user queries for domains by a non-existant organization slug', () => {
      describe('in english', () => {
        it('returns appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainsByOrg(orgSlug: "not-treasury-board-secretariat") {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              userId: user._key,
              query: query,
              auth: {
                checkPermission,
                userRequired,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                orgLoaderBySlug: orgLoaderBySlug(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
              },
            },
          )

          const error = [
            new GraphQLError(
              `Could not retrieve domains for the provided organization slug.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve non-existant organization's domains.`,
          ])
        })
      })
      describe('in french', () => {
        it('returns appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainsByOrg(orgSlug: "ne-pas-secretariat-conseil-tresor") {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              userId: user._key,
              query: query,
              auth: {
                checkPermission,
                userRequired,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                orgLoaderBySlug: orgLoaderBySlug(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
              },
            },
          )

          const error = [
            new GraphQLError(
              `Could not retrieve domains for the provided organization slug.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve non-existant organization's domains.`,
          ])
        })
      })
    })
    describe('User does not belong to organization', () => {
      describe('in english', () => {
        it('returns appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainsByOrg(orgSlug: "treasury-board-secretariat") {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              userId: user._key,
              query: query,
              auth: {
                checkPermission,
                userRequired,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                orgLoaderBySlug: orgLoaderBySlug(query, 'en'),
                userLoaderByKey: userLoaderByKey(query),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
              },
            },
          )

          const error = [
            new GraphQLError(
              `Could not retrieve domains for specified organization.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve domains for specified organization.`,
          ])
        })
      })
      describe('in french', () => {
        it('returns appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findDomainsByOrg(orgSlug: "secretariat-conseil-tresor") {
                  edges {
                    cursor
                    node {
                      id
                      domain
                      lastRan
                      selectors
                    }
                  }
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                }
              }
            `,
            null,
            {
              userId: user._key,
              query: query,
              auth: {
                checkPermission,
                userRequired,
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                orgLoaderBySlug: orgLoaderBySlug(query, 'fr'),
                userLoaderByKey: userLoaderByKey(query),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
              },
            },
          )

          const error = [
            new GraphQLError(
              `Could not retrieve domains for specified organization.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve domains for specified organization.`,
          ])
        })
      })
    })
  })
})
