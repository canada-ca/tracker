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
const { checkPermission, tokenize, userRequired } = require('../auth')
const {
  userLoaderByUserName,
  orgLoaderBySlug,
  userLoaderByKey,
} = require('../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findOrganizationBySlugQuery', () => {
  let query, drop, truncate, migrate, schema, collections, org, i18n, user

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
    describe('given successful organization retrieval', () => {
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
      describe('authorized user queries organization by slug', () => {
        it('returns organization', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findOrganizationBySlug(orgSlug: "treasury-board-secretariat") {
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
            `,
            null,
            {
              i18n,
              userKey: user._key,
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
              },
            },
          )

          const expectedResponse = {
            data: {
              findOrganizationBySlug: {
                id: toGlobalId('organizations', org._key),
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
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved organization ${org._key}.`,
          ])
        })
      })
    })

    describe('given unsuccessful organization retrieval', () => {
      let user
      beforeEach(async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        user = await userCursor.next()
      })
      describe('user does not belong to organization', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findOrganizationBySlug(orgSlug: "treasury-board-secretariat") {
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
            `,
            null,
            {
              i18n,
              userKey: user._key,
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
              },
            },
          )

          const error = [
            new GraphQLError(`Could not retrieve specified organization.`),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve organization.`,
          ])
        })
      })
      describe('organization can not be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findOrganizationBySlug(
                  orgSlug: "not-treasury-board-secretariat"
                ) {
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
            `,
            null,
            {
              i18n,
              userKey: user._key,
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
              },
            },
          )

          const error = [
            new GraphQLError(
              `No organization with the provided slug could be found.`,
            ),
          ]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve organization.`,
          ])
        })
      })
    })
  })
  describe('users language is set to french', () => {
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
    describe('given successful organization retrieval', () => {
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
      describe('authorized user queries organization by slug', () => {
        it('returns organization', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findOrganizationBySlug(orgSlug: "secretariat-conseil-tresor") {
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
            `,
            null,
            {
              i18n,
              userKey: user._key,
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
              },
            },
          )

          const expectedResponse = {
            data: {
              findOrganizationBySlug: {
                id: toGlobalId('organizations', org._key),
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
          }
          expect(response).toEqual(expectedResponse)
          expect(consoleOutput).toEqual([
            `User ${user._key} successfully retrieved organization ${org._key}.`,
          ])
        })
      })
    })

    describe('given unsuccessful organization retrieval', () => {
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
      })
      describe('user does not belong to organization', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findOrganizationBySlug(orgSlug: "secretariat-conseil-tresor") {
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
            `,
            null,
            {
              i18n,
              userKey: user._key,
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
              },
            },
          )

          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve organization.`,
          ])
        })
      })
      describe('organization can not be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findOrganizationBySlug(
                  orgSlug: "ne-pas-secretariat-conseil-tresor"
                ) {
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
            `,
            null,
            {
              i18n,
              userKey: user._key,
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
              },
            },
          )

          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
          expect(consoleOutput).toEqual([
            `User ${user._key} could not retrieve organization.`,
          ])
        })
      })
    })
  })
})
