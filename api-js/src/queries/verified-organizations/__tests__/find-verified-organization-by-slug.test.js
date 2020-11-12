const { ArangoTools, dbNameFromFile } = require('arango-tools')
const { graphql, GraphQLSchema, GraphQLError } = require('graphql')
const { toGlobalId } = require('graphql-relay')
const { setupI18n } = require('@lingui/core')

const englishMessages = require('../../../locale/en/messages')
const frenchMessages = require('../../../locale/fr/messages')
const { makeMigrations } = require('../../../../migrations')
const { createQuerySchema } = require('../..')
const { createMutationSchema } = require('../../../mutations')
const { cleanseInput } = require('../../../validators')
const {
  verifiedOrgLoaderBySlug,
  verifiedDomainLoaderConnectionsByOrgId,
} = require('../../../loaders')
const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findOrganizationBySlugQuery', () => {
  let query, drop, truncate, migrate, schema, collections, org, domain, i18n

  beforeAll(async () => {
    // Generate DB Items
    ;({ migrate } = await ArangoTools({ rootPass, url }))
    ;({ query, drop, truncate, collections } = await migrate(
      makeMigrations({ databaseName: dbNameFromFile(__filename), rootPass }),
    ))
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

    await truncate()
    consoleOutput = []
    org = await collections.organizations.save({
      verified: true,
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
    domain = await collections.domains.save({})
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
  })

  afterAll(async () => {
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
      describe('authorized user queries organization by slug', () => {
        it('returns organization', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findVerifiedOrganizationBySlug(
                  orgSlug: "treasury-board-secretariat"
                ) {
                  id
                }
              }
            `,
            null,
            {
              i18n,
              query: query,
              validators: {
                cleanseInput,
              },
              loaders: {
                verifiedOrgLoaderBySlug: verifiedOrgLoaderBySlug(
                  query,
                  'en',
                  i18n,
                ),
                verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
                  query,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findVerifiedOrganizationBySlug: {
                id: toGlobalId('verifiedOrganizations', org._key),
              },
            },
          }
          expect(response).toEqual(expectedResponse)
        })
      })
    })

    describe('given unsuccessful organization retrieval', () => {
      describe('organization can not be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findVerifiedOrganizationBySlug(
                  orgSlug: "not-treasury-board-secretariat"
                ) {
                  id
                }
              }
            `,
            null,
            {
              i18n,
              query: query,
              validators: {
                cleanseInput,
              },
              loaders: {
                verifiedOrgLoaderBySlug: verifiedOrgLoaderBySlug(
                  query,
                  'en',
                  i18n,
                ),
                verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
                  query,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const error = [
            new GraphQLError(
              `No organization with the provided slug could be found.`,
            ),
          ]

          expect(response.errors).toEqual(error)
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
      describe('authorized user queries organization by slug', () => {
        it('returns organization', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findVerifiedOrganizationBySlug(
                  orgSlug: "secretariat-conseil-tresor"
                ) {
                  id
                }
              }
            `,
            null,
            {
              i18n,
              query: query,
              validators: {
                cleanseInput,
              },
              loaders: {
                verifiedOrgLoaderBySlug: verifiedOrgLoaderBySlug(
                  query,
                  'fr',
                  i18n,
                ),
                verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
                  query,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const expectedResponse = {
            data: {
              findVerifiedOrganizationBySlug: {
                id: toGlobalId('verifiedOrganizations', org._key),
              },
            },
          }
          expect(response).toEqual(expectedResponse)
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
      describe('organization can not be found', () => {
        it('returns an appropriate error message', async () => {
          const response = await graphql(
            schema,
            `
              query {
                findVerifiedOrganizationBySlug(
                  orgSlug: "ne-pas-secretariat-conseil-tresor"
                ) {
                  id
                }
              }
            `,
            null,
            {
              i18n,
              query: query,
              validators: {
                cleanseInput,
              },
              loaders: {
                verifiedOrgLoaderBySlug: verifiedOrgLoaderBySlug(
                  query,
                  'fr',
                  i18n,
                ),
                verifiedDomainLoaderConnectionsByOrgId: verifiedDomainLoaderConnectionsByOrgId(
                  query,
                  cleanseInput,
                  i18n,
                ),
              },
            },
          )

          const error = [new GraphQLError(`todo`)]

          expect(response.errors).toEqual(error)
        })
      })
    })
  })
})
