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
import { checkPermission, userRequired, verifiedRequired } from '../../../auth'
import { loadAffiliationConnectionsByOrgId } from '../../../affiliation/loaders'
import { loadDomainConnectionsByOrgId } from '../../../domain/loaders'
import { loadUserByKey } from '../../../user/loaders'
import { loadOrgBySlug, loadOrgByKey } from '../../loaders'

const { DB_PASS: rootPass, DB_URL: url } = process.env

describe('given findOrganizationBySlugQuery', () => {
  let query, drop, truncate, schema, collections, org, i18n, user, domain

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    // Create GQL Schema
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
    // Generate DB Items
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })
  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
    })
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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
    })
    await collections.claims.save({
      _from: org._id,
      _to: domain._id,
    })
    consoleOutput.length = 0
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
    describe('given successful organization retrieval', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
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
                  domainCount
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: query,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadOrgByKey: loadOrgByKey(query, 'en'),
                loadOrgBySlug: loadOrgBySlug({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
                loadDomainConnectionsByOrgId: loadDomainConnectionsByOrgId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                }),
                loadAffiliationConnectionsByOrgId:
                  loadAffiliationConnectionsByOrgId({
                    query,
                    userKey: user._key,
                    cleanseInput,
                    i18n,
                  }),
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
                domainCount: 1,
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadOrgBySlug: loadOrgBySlug({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
              },
            },
          )

          const error = [
            new GraphQLError(
              `Permission Denied: Could not retrieve specified organization.`,
            ),
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadOrgBySlug: loadOrgBySlug({ query, language: 'en' }),
                loadUserByKey: loadUserByKey({ query }),
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
    describe('given successful organization retrieval', () => {
      beforeEach(async () => {
        await collections.affiliations.save({
          _from: org._id,
          _to: user._id,
          permission: 'user',
        })
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
                  domainCount
                }
              }
            `,
            null,
            {
              i18n,
              userKey: user._key,
              query: query,
              auth: {
                checkPermission: checkPermission({
                  userKey: user._key,
                  query,
                }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadOrgByKey: loadOrgByKey(query, 'fr'),
                loadOrgBySlug: loadOrgBySlug({ query, language: 'fr' }),
                loadUserByKey: loadUserByKey({ query }),
                loadDomainConnectionsByOrgId: loadDomainConnectionsByOrgId({
                  query,
                  userKey: user._key,
                  cleanseInput,
                  i18n,
                }),
                loadAffiliationConnectionsByOrgId:
                  loadAffiliationConnectionsByOrgId({
                    query,
                    userKey: user._key,
                    cleanseInput,
                    i18n,
                  }),
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
                domainCount: 1,
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadOrgBySlug: loadOrgBySlug({ query, language: 'fr' }),
                loadUserByKey: loadUserByKey({ query }),
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
                checkPermission: checkPermission({ userKey: user._key, query }),
                userRequired: userRequired({
                  userKey: user._key,
                  loadUserByKey: loadUserByKey({ query }),
                }),
                verifiedRequired: verifiedRequired({}),
              },
              validators: {
                cleanseInput,
              },
              loaders: {
                loadOrgBySlug: loadOrgBySlug({ query, language: 'fr' }),
                loadUserByKey: loadUserByKey({ query }),
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
