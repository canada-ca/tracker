import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'
import { setupI18n } from '@lingui/core'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import { cleanseInput } from '../../../validators'
import { checkPermission, userRequired, saltedHash, verifiedRequired, tfaRequired } from '../../../auth'
import { loadTagByTagId } from '../../../tags/loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url, HASHING_SECRET } = process.env

describe('updateDomainsByFilters mutation', () => {
  let query, drop, i18n, truncate, schema, collections, transaction, user, org, tag

  const consoleOutput = []
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)
  beforeAll(async () => {
    console.warn = mockedWarn
    console.error = mockedError
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
  })
  afterEach(() => {
    consoleOutput.length = 0
  })
  beforeAll(async () => {
    ;({ query, drop, truncate, collections, transaction } = await ensure({
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
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
      tfaSendMethod: 'email',
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
    tag = await collections.tags.save({
      tagId: 'tag-1',
      tagName: 'Test Tag',
      visible: true,
      ownership: 'global',
      organizations: [org._key],
    })
  })
  afterEach(async () => {
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })

  describe('user has super admin permission', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: { en: { plurals: {} }, fr: { plurals: {} } },
        locales: ['en', 'fr'],
        messages: { en: englishMessages.messages, fr: frenchMessages.messages },
      })
    })
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'super_admin',
      })
    })
    it('updates domains by filters', async () => {
      // Insert a domain and claim for the org
      const domain = await collections.domains.save({ domain: 'test.domain.gov' })
      await collections.claims.save({
        _from: org._id,
        _to: domain._id,
        tags: [],
      })
      const response = await graphql({
        schema,
        source: `
          mutation {
            updateDomainsByFilters(
              input: {
                orgId: "${toGlobalId('organizations', org._key)}"
                tags: ["${tag.tagId}"]
                filters: []
                search: "test.domain.gov"
              }
            ) {
              result {
                ... on DomainBulkResult {
                  status
                }
                ... on DomainError {
                  code
                  description
                }
              }
            }
          }
        `,
        rootValue: null,
        contextValue: {
          request: { language: 'en' },
          i18n,
          query,
          collections: collectionNames,
          transaction,
          userKey: user._key,
          auth: {
            checkPermission: checkPermission({ userKey: user._key, query }),
            saltedHash: saltedHash(HASHING_SECRET),
            userRequired: userRequired({ userKey: user._key, loadUserByKey: loadUserByKey({ query }) }),
            verifiedRequired: verifiedRequired({}),
            tfaRequired: tfaRequired({}),
          },
          loaders: {
            loadTagByTagId: loadTagByTagId({ query }),
            loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
          },
          validators: { cleanseInput },
        },
      })
      console.log(response)
      expect(response.data.updateDomainsByFilters.result.status).toMatch(
        /Successfully updated 1 domain\(s\) in treasury-board-secretariat/,
      )
    })
  })

  describe('user does not have permission', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: { en: { plurals: {} }, fr: { plurals: {} } },
        locales: ['en', 'fr'],
        messages: { en: englishMessages.messages, fr: frenchMessages.messages },
      })
    })
    beforeEach(async () => {
      await collections.affiliations.save({
        _from: org._id,
        _to: user._id,
        permission: 'user',
      })
    })
    it('returns an error message', async () => {
      const response = await graphql({
        schema,
        source: `
          mutation {
            updateDomainsByFilters(
              input: {
                orgId: "${toGlobalId('organizations', org._key)}"
                tags: ["${tag.tagId}"]
                filters: []
                search: "test.domain.gov"
              }
            ) {
              result {
                ... on DomainBulkResult {
                  status
                }
                ... on DomainError {
                  code
                  description
                }
              }
            }
          }
        `,
        rootValue: null,
        contextValue: {
          request: { language: 'en' },
          i18n,
          query,
          collections: collectionNames,
          transaction,
          userKey: user._key,
          auth: {
            checkPermission: checkPermission({ userKey: user._key, query }),
            saltedHash: saltedHash(HASHING_SECRET),
            userRequired: userRequired({ userKey: user._key, loadUserByKey: loadUserByKey({ query }) }),
            verifiedRequired: verifiedRequired({}),
            tfaRequired: tfaRequired({}),
          },
          loaders: {
            loadTagByTagId: loadTagByTagId({ query }),
            loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
          },
          validators: { cleanseInput },
        },
      })
      expect(response.data.updateDomainsByFilters.result.code).toBe(400)
      expect(response.data.updateDomainsByFilters.result.description).toMatch(/Permission Denied/)
    })
  })
})
