import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { loadVerifiedDomainConnectionsByOrgId } from '../../../verified-domains/loaders'
import { loadVerifiedOrgBySlug } from '../../loaders'
import dbschema from '../../../../database.json'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findOrganizationBySlugQuery', () => {
  let query, drop, truncate, schema, collections, org, domain, i18n
  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(() => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })

  describe('given a successful query', () => {
    beforeAll(async () => {
      // Generate DB Items
      ;({ query, drop, truncate, collections } = await ensure({
      variables: {
        dbname: dbNameFromFile(__filename),
        username: 'root',
        rootPassword: rootPass,
        password: rootPass,
        url,
      },

      schema: dbschema,
    }))
    })
    beforeEach(async () => {
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
    afterEach(async () => {
      await truncate()
    })
    afterAll(async () => {
      await drop()
    })
    describe('users language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
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
                loadVerifiedOrgBySlug: loadVerifiedOrgBySlug({
                  query,
                  language: 'en',
                  i18n,
                }),
                loadVerifiedDomainConnectionsByOrgId:
                  loadVerifiedDomainConnectionsByOrgId({
                    query,
                    cleanseInput,
                    i18n,
                  }),
              },
            },
          )

          const expectedResponse = {
            data: {
              findVerifiedOrganizationBySlug: {
                id: toGlobalId('verifiedOrganization', org._key),
              },
            },
          }
          expect(response).toEqual(expectedResponse)
        })
      })
    })
    describe('users language is set to french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
          },
        })
      })
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
                loadVerifiedOrgBySlug: loadVerifiedOrgBySlug({
                  query,
                  language: 'fr',
                  i18n,
                }),
                loadVerifiedDomainConnectionsByOrgId:
                  loadVerifiedDomainConnectionsByOrgId({
                    query,
                    cleanseInput,
                    i18n,
                  }),
              },
            },
          )

          const expectedResponse = {
            data: {
              findVerifiedOrganizationBySlug: {
                id: toGlobalId('verifiedOrganization', org._key),
              },
            },
          }
          expect(response).toEqual(expectedResponse)
        })
      })
    })
  })

  describe('given unsuccessful organization retrieval', () => {
    describe('users language is set to english', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'en',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
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
                  orgSlug: "not-treasury-board-secretariat"
                ) {
                  id
                }
              }
            `,
            null,
            {
              i18n,
              query: jest.fn(),
              validators: {
                cleanseInput,
              },
              loaders: {
                loadVerifiedOrgBySlug: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          )

          const error = [
            new GraphQLError(
              `No verified organization with the provided slug could be found.`,
            ),
          ]

          expect(response.errors).toEqual(error)
        })
      })
    })
    describe('users language is set to french', () => {
      beforeAll(() => {
        i18n = setupI18n({
          locale: 'fr',
          localeData: {
            en: { plurals: {} },
            fr: { plurals: {} },
          },
          locales: ['en', 'fr'],
          messages: {
            en: englishMessages.messages,
            fr: frenchMessages.messages,
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
              query: jest.fn(),
              validators: {
                cleanseInput,
              },
              loaders: {
                loadVerifiedOrgBySlug: {
                  load: jest.fn().mockReturnValue(undefined),
                },
              },
            },
          )

          const error = [
            new GraphQLError(
              `Aucune organisation vérifiée avec le slug fourni n'a pu être trouvée.`,
            ),
          ]

          expect(response.errors).toEqual(error)
        })
      })
    })
  })
})
