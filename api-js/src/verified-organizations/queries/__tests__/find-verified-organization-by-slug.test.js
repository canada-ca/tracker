import { ensure, dbNameFromFile } from 'arango-tools'
import { graphql, GraphQLSchema, GraphQLError } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { databaseOptions } from '../../../../database-options'
import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { verifiedDomainLoaderConnectionsByOrgId } from '../../../verified-domains/loaders'
import { verifiedOrgLoaderBySlug } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findOrganizationBySlugQuery', () => {
  let query, drop, truncate, schema, collections, org, domain, i18n

  beforeAll(async () => {
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
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
    consoleOutput = []
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
              `No verified organization with the provided slug could be found.`,
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
