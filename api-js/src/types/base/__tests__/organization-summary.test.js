const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema } = require('graphql')
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

describe('given the organization summary object', () => {
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
    domain

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
    describe('user queries for their organization summaries', () => {
      beforeEach(async () => {
        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'user',
        })
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: user._id,
          permission: 'user',
        })
      })
      afterEach(async () => {
        await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
        await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
        await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
      })
      it('returns queried fields', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findMyOrganizations(first: 5) {
                edges {
                  node {
                    summaries {
                      web {
                        total
                        categories {
                          name
                          count
                          percentage
                        }
                      }
                      mail {
                        total
                        categories {
                          name
                          count
                          percentage
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            userId: user._key,
            auth: {
              checkPermission: checkPermission({
                i18n,
                userId: user._key,
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
                  node: {
                    summaries: {
                      mail: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'pass',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'fail',
                            percentage: 95.2,
                          },
                        ],
                      },
                      web: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'pass',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'fail',
                            percentage: 95.2,
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  node: {
                    summaries: {
                      mail: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'pass',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'fail',
                            percentage: 95.2,
                          },
                        ],
                      },
                      web: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'pass',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'fail',
                            percentage: 95.2,
                          },
                        ],
                      },
                    },
                  },
                },
              ],
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
  describe('users language is set to french', () => {
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
    describe('user queries for their organization summaries', () => {
      beforeEach(async () => {
        const userCursor = await query`
            FOR user IN users
              FILTER user.userName == "test.account@istio.actually.exists"
              RETURN user
          `
        user = await userCursor.next()
        await collections.affiliations.save({
          _from: orgOne._id,
          _to: user._id,
          permission: 'user',
        })
        await collections.affiliations.save({
          _from: orgTwo._id,
          _to: user._id,
          permission: 'user',
        })
      })
      afterEach(async () => {
        await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgOne._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
        await query`
            LET userEdges = (FOR v, e IN 1..1 ANY ${orgTwo._id} affiliations RETURN { edgeKey: e._key, userId: e._to })
            LET removeUserEdges = (FOR userEdge IN userEdges REMOVE userEdge.edgeKey IN affiliations)
            RETURN true
          `
        await query`
            FOR affiliation IN affiliations
              REMOVE affiliation IN affiliations
          `
      })
      it('returns queried fields', async () => {
        const response = await graphql(
          schema,
          `
            query {
              findMyOrganizations(first: 5) {
                edges {
                  node {
                    summaries {
                      web {
                        total
                        categories {
                          name
                          count
                          percentage
                        }
                      }
                      mail {
                        total
                        categories {
                          name
                          count
                          percentage
                        }
                      }
                    }
                  }
                }
              }
            }
          `,
          null,
          {
            i18n,
            userId: user._key,
            auth: {
              checkPermission: checkPermission({
                i18n,
                userId: user._key,
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
                  node: {
                    summaries: {
                      mail: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'todo',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'todo',
                            percentage: 95.2,
                          },
                        ],
                      },
                      web: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'todo',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'todo',
                            percentage: 95.2,
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  node: {
                    summaries: {
                      mail: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'todo',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'todo',
                            percentage: 95.2,
                          },
                        ],
                      },
                      web: {
                        total: 1050,
                        categories: [
                          {
                            count: 50,
                            name: 'todo',
                            percentage: 4.8,
                          },
                          {
                            count: 1000,
                            name: 'todo',
                            percentage: 95.2,
                          },
                        ],
                      },
                    },
                  },
                },
              ],
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
})
