const dotenv = require('dotenv-safe')
dotenv.config()

const { SIGN_IN_KEY } = process.env

const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { makeMigrations } = require('../../migrations')
const { createQuerySchema } = require('../queries')
const { createMutationSchema } = require('../mutations')

const bcrypt = require('bcrypt')
const { cleanseInput, slugify } = require('../validators')
const { tokenize, userRequired } = require('../auth')
const {
  orgLoaderBySlug,
  userLoaderById,
  userLoaderByUserName,
} = require('../loaders')

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('create an organization', () => {
  let query, drop, truncate, migrate, schema, collections

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
  })

  afterEach(async () => {
    await drop()
  })

  describe('given a successful org creation', () => {
    describe('language is set to english', () => {
      it('returns the organizations information', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                organization {
                  id
                  acronym
                  slug
                  name
                  zone
                  sector
                  country
                  province
                  city
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            userId: user._key,
            auth: {
              userRequired,
            },
            loaders: {
              orgLoaderBySlug: orgLoaderBySlug(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("treasury-board-of-canada-secretariat") == LOWER(TRANSLATE("en", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("en", org.orgDetails))
        `

        const org = await orgCursor.next()

        const expectedResponse = {
          data: {
            createOrganization: {
              organization: {
                id: `${toGlobalId('organizations', org._key)}`,
                acronym: org.acronym,
                slug: org.slug,
                name: org.name,
                zone: org.zone,
                sector: org.sector,
                country: org.country,
                province: org.province,
                city: org.city,
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created a new organization: ${org.slug}`,
        ])
      })
    })
    describe('language is set to french', () => {
      it('returns the organizations information', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                organization {
                  id
                  acronym
                  slug
                  name
                  zone
                  sector
                  country
                  province
                  city
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'fr',
            },
            query,
            userId: user._key,
            auth: {
              userRequired,
            },
            loaders: {
              orgLoaderBySlug: orgLoaderBySlug(query, 'fr'),
              userLoaderById: userLoaderById(query),
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const orgCursor = await query`
          FOR org IN organizations
            FILTER (LOWER("secretariat-du-conseil-tresor-du-canada") == LOWER(TRANSLATE("fr", org.orgDetails).slug))
            RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev }, TRANSLATE("fr", org.orgDetails))
        `

        const org = await orgCursor.next()

        const expectedResponse = {
          data: {
            createOrganization: {
              organization: {
                id: `${toGlobalId('organizations', org._key)}`,
                acronym: org.acronym,
                slug: org.slug,
                name: org.name,
                zone: org.zone,
                sector: org.sector,
                country: org.country,
                province: org.province,
                city: org.city,
              },
            },
          },
        }

        expect(response).toEqual(expectedResponse)
        expect(consoleOutput).toEqual([
          `User: ${user._key} successfully created a new organization: treasury-board-of-canada-secretariat`,
        ])
      })
    })
  })
  describe('given an unsuccessful org creation', () => {
    describe('organization already exists', () => {
      beforeEach(async () => {
        await collections.organizations.save({
          orgDetails: {
            en: {
              slug: 'treasury-board-of-canada-secretariat',
              acronym: 'TBS',
              name: 'Treasury Board of Canada Secretariat',
              zone: 'FED',
              sector: 'TBS',
              country: 'Canada',
              province: 'Ontario',
              city: 'Ottawa',
            },
            fr: {
              slug: 'secretariat-du-conseil-tresor-du-canada',
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
      it('returns an error', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                organization {
                  id
                  acronym
                  slug
                  name
                  zone
                  sector
                  country
                  province
                  city
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            userId: user._key,
            auth: {
              userRequired,
            },
            loaders: {
              orgLoaderBySlug: orgLoaderBySlug(query, 'en'),
              userLoaderById: userLoaderById(query),
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to create organization. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `User: ${user._key} attempted to create an organization that already exists: treasury-board-of-canada-secretariat`,
        ])
      })
    })
    describe('database error occurs when inserting organization', () => {
      it('returns an error', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const orgLoader = orgLoaderBySlug(query, 'en')
        const userLoader = userLoaderById(query)

        query = jest
          .fn()
          .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                organization {
                  id
                  acronym
                  slug
                  name
                  zone
                  sector
                  country
                  province
                  city
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            userId: user._key,
            auth: {
              userRequired,
            },
            loaders: {
              orgLoaderBySlug: orgLoader,
              userLoaderById: userLoader,
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const error = [
          new GraphQLError('Unable to create organization. Please try again.'),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred when user: ${user._key} was creating new organization treasury-board-of-canada-secretariat: Error: Database error occurred.`,
        ])
      })
    })
    describe('database error occurs when inserting edge', () => {
      it('returns an error message', async () => {
        const userCursor = await query`
          FOR user IN users
            FILTER user.userName == "test.account@istio.actually.exists"
            RETURN user
        `
        const user = await userCursor.next()

        const orgLoader = orgLoaderBySlug(query, 'en')
        const userLoader = userLoaderById(query)

        query = jest
          .fn()
          .mockResolvedValueOnce({
            next() {
              return 'test'
            },
          })
          .mockRejectedValue(new Error('Database error occurred.'))

        const response = await graphql(
          schema,
          `
            mutation {
              createOrganization(
                input: {
                  acronymEN: "TBS"
                  acronymFR: "SCT"
                  nameEN: "Treasury Board of Canada Secretariat"
                  nameFR: "Secrétariat du Conseil Trésor du Canada"
                  zoneEN: "FED"
                  zoneFR: "FED"
                  sectorEN: "TBS"
                  sectorFR: "TBS"
                  countryEN: "Canada"
                  countryFR: "Canada"
                  provinceEN: "Ontario"
                  provinceFR: "Ontario"
                  cityEN: "Ottawa"
                  cityFR: "Ottawa"
                }
              ) {
                organization {
                  id
                  acronym
                  slug
                  name
                  zone
                  sector
                  country
                  province
                  city
                }
              }
            }
          `,
          null,
          {
            request: {
              language: 'en',
            },
            query,
            userId: user._key,
            auth: {
              userRequired,
            },
            loaders: {
              orgLoaderBySlug: orgLoader,
              userLoaderById: userLoader,
            },
            validators: {
              cleanseInput,
              slugify,
            },
          },
        )

        const error = [
          new GraphQLError(
            'Error creating affiliation. Please contact a system administrator for assistance.',
          ),
        ]

        expect(response.errors).toEqual(error)
        expect(consoleOutput).toEqual([
          `Database error occurred when inserting edge definition for user: ${user._key} to treasury-board-of-canada-secretariat: Error: Database error occurred.`,
        ])
      })
    })
  })
})
