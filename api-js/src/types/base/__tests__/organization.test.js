const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../../../queries')
const { createMutationSchema } = require('../../../mutations')
const { cleanseInput } = require('../../../validators')
const { tokenize, checkPermission } = require('../../../auth')
const {
  orgLoaderConnectionsByUserId,
  userLoaderByUserName,
  domainLoaderConnectionsByOrgId,
  affiliationLoaderByOrgId,
} = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given the organization connection object, and the organization object', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    orgOne,
    orgTwo,
    i18n,
    user,
    domain,
    affiliation1,
    affiliation2

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

    orgOne = await collections.organizations.save({
      verified: false,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
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
    orgTwo = await collections.organizations.save({
      verified: true,
      summaries: {
        web: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
        mail: {
          pass: 50,
          fail: 1000,
          total: 1050,
        },
      },
      orgDetails: {
        en: {
          slug: 'not-treasury-board-secretariat',
          acronym: 'NTBS',
          name: 'Not Treasury Board of Canada Secretariat',
          zone: 'NFED',
          sector: 'NTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
        fr: {
          slug: 'ne-pas-secretariat-conseil-tresor',
          acronym: 'NPSCT',
          name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
          zone: 'NPFED',
          sector: 'NPTBS',
          country: 'Canada',
          province: 'Ontario',
          city: 'Ottawa',
        },
      },
    })
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
    })
    await collections.claims.save({
      _from: orgOne._id,
      _to: domain._id,
    })
    await collections.claims.save({
      _from: orgTwo._id,
      _to: domain._id,
    })
  })

  afterEach(async () => {
    await drop()
  })

  describe('users language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
      })
    })
    describe('given successful retrieval of organizations', () => {
      describe('admin queries for all organization fields', () => {
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
          affiliation1 = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'admin',
          })
          affiliation2 = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        afterEach(async () => {
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
        })
        it('resolves all fields', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyOrganizations(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      acronym
                      name
                      slug
                      zone
                      sector
                      country
                      province
                      city
                      verified
                      summaries {
                        web {
                          total
                        }
                      }
                      domainCount
                      domains(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                      affiliations(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }
                  }
                  totalCount
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
              i18n,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                  query,
                  user._key,
                  cleanseInput,
                  'en',
                ),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
                affiliationLoaderByOrgId: affiliationLoaderByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: toGlobalId('organizations', orgOne._key),
                    node: {
                      id: toGlobalId('organizations', orgOne._key),
                      slug: 'treasury-board-secretariat',
                      acronym: 'TBS',
                      name: 'Treasury Board of Canada Secretariat',
                      zone: 'FED',
                      sector: 'TBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: false,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('affiliations', affiliation1._key),
                            },
                          },
                        ],
                      },
                    },
                  },
                  {
                    cursor: toGlobalId('organizations', orgTwo._key),
                    node: {
                      id: toGlobalId('organizations', orgTwo._key),
                      slug: 'not-treasury-board-secretariat',
                      acronym: 'NTBS',
                      name: 'Not Treasury Board of Canada Secretariat',
                      zone: 'NFED',
                      sector: 'NTBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: true,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('affiliations', affiliation2._key),
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  endCursor: toGlobalId('organizations', orgTwo._key),
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organizations', orgOne._key),
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved their organizations.`,
          ])
        })
      })
    })
    describe('error is raised when user tries to access affiliation field', () => {
      describe('user queries for all organization fields', () => {
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
          affiliation1 = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'user',
          })
          affiliation2 = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'user',
          })
        })
        afterEach(async () => {
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
        })
        it('resolves all fields', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyOrganizations(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      acronym
                      name
                      slug
                      zone
                      sector
                      country
                      province
                      city
                      verified
                      summaries {
                        web {
                          total
                        }
                      }
                      domainCount
                      domains(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                      affiliations(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }
                  }
                  totalCount
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
              i18n,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                  query,
                  user._key,
                  cleanseInput,
                  'en',
                ),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
                affiliationLoaderByOrgId: affiliationLoaderByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: toGlobalId('organizations', orgOne._key),
                    node: {
                      id: toGlobalId('organizations', orgOne._key),
                      slug: 'treasury-board-secretariat',
                      acronym: 'TBS',
                      name: 'Treasury Board of Canada Secretariat',
                      zone: 'FED',
                      sector: 'TBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: false,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: null,
                    },
                  },
                  {
                    cursor: toGlobalId('organizations', orgTwo._key),
                    node: {
                      id: toGlobalId('organizations', orgTwo._key),
                      slug: 'not-treasury-board-secretariat',
                      acronym: 'NTBS',
                      name: 'Not Treasury Board of Canada Secretariat',
                      zone: 'NFED',
                      sector: 'NTBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: true,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: null,
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  endCursor: toGlobalId('organizations', orgTwo._key),
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organizations', orgOne._key),
                },
              },
            },
            errors: [
              new GraphQLError(
                'Cannot query affiliations on organization without admin permission or higher.',
              ),
              new GraphQLError(
                'Cannot query affiliations on organization without admin permission or higher.',
              ),
            ],
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved their organizations.`,
          ])
        })
      })
    })
  })
  describe('users language is set to french', () => {
    describe('given successful retrieval of organizations', () => {
      describe('admin queries for all organization fields', () => {
        beforeAll(() => {
          i18n = setupI18n({
            language: 'fr',
            locales: ['en', 'fr'],
            missing: 'Traduction manquante',
            catalogs: {
              en: englishMessages,
              fr: frenchMessages,
            },
          })
        })
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
          affiliation1 = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'admin',
          })
          affiliation2 = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'admin',
          })
        })
        afterEach(async () => {
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
        })
        it('resolves all fields', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyOrganizations(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      acronym
                      name
                      slug
                      zone
                      sector
                      country
                      province
                      city
                      verified
                      summaries {
                        web {
                          total
                        }
                      }
                      domainCount
                      domains(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                      affiliations(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }
                  }
                  totalCount
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
              i18n,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                  query,
                  user._key,
                  cleanseInput,
                  'fr',
                ),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
                affiliationLoaderByOrgId: affiliationLoaderByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: toGlobalId('organizations', orgOne._key),
                    node: {
                      id: toGlobalId('organizations', orgOne._key),
                      slug: 'secretariat-conseil-tresor',
                      acronym: 'SCT',
                      name: 'Secrétariat du Conseil Trésor du Canada',
                      zone: 'FED',
                      sector: 'TBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: false,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('affiliations', affiliation1._key),
                            },
                          },
                        ],
                      },
                    },
                  },
                  {
                    cursor: toGlobalId('organizations', orgTwo._key),
                    node: {
                      id: toGlobalId('organizations', orgTwo._key),
                      slug: 'ne-pas-secretariat-conseil-tresor',
                      acronym: 'NPSCT',
                      name: 'Ne Pas Secrétariat du Conseil Trésor du Canada',
                      zone: 'NPFED',
                      sector: 'NPTBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: true,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('affiliations', affiliation2._key),
                            },
                          },
                        ],
                      },
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  endCursor: toGlobalId('organizations', orgTwo._key),
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organizations', orgOne._key),
                },
              },
            },
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved their organizations.`,
          ])
        })
      })
    })
    describe('error is raised when user tries to access affiliation field', () => {
      describe('user queries for all organization fields', () => {
        beforeEach(async () => {
          const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
          user = await userCursor.next()
          affiliation1 = await collections.affiliations.save({
            _from: orgOne._id,
            _to: user._id,
            permission: 'user',
          })
          affiliation2 = await collections.affiliations.save({
            _from: orgTwo._id,
            _to: user._id,
            permission: 'user',
          })
        })
        afterEach(async () => {
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userKey: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
          await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
        })
        it('resolves all fields', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findMyOrganizations(first: 5) {
                  edges {
                    cursor
                    node {
                      id
                      acronym
                      name
                      slug
                      zone
                      sector
                      country
                      province
                      city
                      verified
                      summaries {
                        web {
                          total
                        }
                      }
                      domainCount
                      domains(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                      affiliations(first: 5) {
                        edges {
                          node {
                            id
                          }
                        }
                      }
                    }
                  }
                  totalCount
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
              i18n,
              userKey: user._key,
              auth: {
                checkPermission: checkPermission({
                  i18n,
                  userKey: user._key,
                  query,
                }),
              },
              loaders: {
                orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                  query,
                  user._key,
                  cleanseInput,
                  'en',
                ),
                domainLoaderConnectionsByOrgId: domainLoaderConnectionsByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                ),
                affiliationLoaderByOrgId: affiliationLoaderByOrgId(
                  query,
                  user._key,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findMyOrganizations: {
                edges: [
                  {
                    cursor: toGlobalId('organizations', orgOne._key),
                    node: {
                      id: toGlobalId('organizations', orgOne._key),
                      slug: 'treasury-board-secretariat',
                      acronym: 'TBS',
                      name: 'Treasury Board of Canada Secretariat',
                      zone: 'FED',
                      sector: 'TBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: false,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: null,
                    },
                  },
                  {
                    cursor: toGlobalId('organizations', orgTwo._key),
                    node: {
                      id: toGlobalId('organizations', orgTwo._key),
                      slug: 'not-treasury-board-secretariat',
                      acronym: 'NTBS',
                      name: 'Not Treasury Board of Canada Secretariat',
                      zone: 'NFED',
                      sector: 'NTBS',
                      country: 'Canada',
                      province: 'Ontario',
                      city: 'Ottawa',
                      verified: true,
                      summaries: {
                        web: {
                          total: 1050,
                        },
                      },
                      domainCount: 1,
                      domains: {
                        edges: [
                          {
                            node: {
                              id: toGlobalId('domains', domain._key),
                            },
                          },
                        ],
                      },
                      affiliations: null,
                    },
                  },
                ],
                totalCount: 2,
                pageInfo: {
                  endCursor: toGlobalId('organizations', orgTwo._key),
                  hasNextPage: false,
                  hasPreviousPage: false,
                  startCursor: toGlobalId('organizations', orgOne._key),
                },
              },
            },
            errors: [new GraphQLError('todo'), new GraphQLError('todo')],
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved their organizations.`,
          ])
        })
      })
    })
  })
})
