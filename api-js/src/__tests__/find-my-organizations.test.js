const dotenv = require('dotenv-safe')
dotenv.config()

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const bcrypt = require('bcrypt')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')
const { cleanseInput } = require('../validators')
const { tokenize } = require('../auth')
const {
  orgLoaderConnectionsByUserId,
  userLoaderByUserName,
} = require('../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findMyOrganizationsQuery', () => {
  let query,
    drop,
    truncate,
    migrate,
    schema,
    collections,
    orgOne,
    orgTwo,
    i18n,
    user

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
    describe('given successful retrieval of domains', () => {
      describe('user queries for their organizations', () => {
        describe('in english', () => {
          it('returns organizations', async () => {
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
                i18n,
                userId: user._key,
                loaders: {
                  orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                    query,
                    user._key,
                    cleanseInput,
                    'en',
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
                      },
                    },
                  ],
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
    })
    describe('database error occurs', () => {
      it('returns an error message', async () => {
        const mockedOrgLoaderConnectionsByUserId = jest
          .fn()
          .mockRejectedValueOnce(new Error('Database error occurred.'))

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
            i18n,
            userId: user._key,
            loaders: {
              orgLoaderConnectionsByUserId: mockedOrgLoaderConnectionsByUserId,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to load organizations. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather organization connections in findMyOrganizations.`,
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
    describe('given successful retrieval of domains', () => {
      describe('user queries for their organizations', () => {
        describe('in french', () => {
          it('returns organizations', async () => {
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
                i18n,
                userId: user._key,
                loaders: {
                  orgLoaderConnectionsByUserId: orgLoaderConnectionsByUserId(
                    query,
                    user._key,
                    cleanseInput,
                    'fr',
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
                      },
                    },
                  ],
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
    })
    describe('database error occurs', () => {
      it('returns an error message', async () => {
        const mockedOrgLoaderConnectionsByUserId = jest
          .fn()
          .mockRejectedValueOnce(new Error('Database error occurred.'))

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
            i18n,
            userId: user._key,
            loaders: {
              orgLoaderConnectionsByUserId: mockedOrgLoaderConnectionsByUserId,
            },
          },
        )

        const error = [new GraphQLError('todo')]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred while user: ${user._key} was trying to gather organization connections in findMyOrganizations.`,
        ])
      })
    })
  })
})
