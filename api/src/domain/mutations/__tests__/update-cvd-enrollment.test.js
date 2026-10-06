import { setupI18n } from '@lingui/core'
import { dbNameFromFile } from 'arango-tools'
import { ensureDatabase as ensure } from '../../../testUtilities'
import { graphql as rawGraphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'
import {
  checkPermission,
  userRequired,
  verifiedRequired,
  tfaRequired,
  checkDomainPermission,
  getDeniedFields,
  AuthDataSource,
} from '../../../auth'
import { DomainDataSource } from '../../data-source'
import { OrganizationDataSource } from '../../../organization/data-source'
import { TagsDataSource } from '../../../tags/data-source'
import { AuditLogsDataSource } from '../../../audit-logs/data-source'
import { loadDkimSelectorsByDomainId, loadDomainByKey } from '../../loaders'
import { loadOrgByKey } from '../../../organization/loaders'
import { loadUserByKey } from '../../../user/loaders'
import dbschema from '../../../../database.json'
import { collectionNames } from '../../../collection-names'

const { DB_PASS: rootPass, DB_URL: url } = process.env

const withDataSources = (contextValue) => {
  const query = contextValue?.query
  const transaction = contextValue?.transaction
  const collections = contextValue?.collections
  const userKey = contextValue?.userKey
  const i18n = contextValue?.i18n
  const language = contextValue?.request?.language
  const cleanseInput = contextValue?.validators?.cleanseInput

  const domainDataSource =
    contextValue?.dataSources?.domain || new DomainDataSource({ query, userKey, i18n, transaction, collections })
  if (contextValue?.loaders?.loadDomainByKey) {
    domainDataSource.byKey = contextValue.loaders.loadDomainByKey
  }

  const organizationDataSource =
    contextValue?.dataSources?.organization ||
    new OrganizationDataSource({ query, userKey, i18n, language, cleanseInput, transaction, collections })
  if (contextValue?.loaders?.loadOrgByKey) {
    organizationDataSource.byKey = contextValue.loaders.loadOrgByKey
  }

  const tagsDataSource =
    contextValue?.dataSources?.tags || new TagsDataSource({ query, userKey, i18n, language, transaction, collections })

  const auditLogs =
    contextValue?.dataSources?.auditLogs || new AuditLogsDataSource({ query, userKey, cleanseInput, i18n, transaction, collections })

  return {
    ...contextValue,
    auth: {
      ...contextValue?.auth,
      getDeniedFields: contextValue?.auth?.getDeniedFields || getDeniedFields,
    },
    dataSources: {
      ...contextValue?.dataSources,
      domain: domainDataSource,
      organization: organizationDataSource,
      tags: tagsDataSource,
      auditLogs,
    },
  }
}

const graphql = ({ contextValue, ...args }) => {
  return rawGraphql({
    ...args,
    contextValue: withDataSources(contextValue),
  })
}


describe('updating a domain cvdEnrollment', () => {
  let query, drop, truncate, schema, collections, transaction, publish, user, org, domain

  const storedCvdEnrollment = {
    status: 'enrolled',
    description: 'Stored asset description',
    maxSeverity: 'high',
    confidentialityRequirement: 'high',
    integrityRequirement: 'low',
    availabilityRequirement: 'none',
  }

  const i18n = setupI18n({
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

  const consoleOutput = []
  const mockedInfo = (output) => consoleOutput.push(output)
  const mockedWarn = (output) => consoleOutput.push(output)
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.info = mockedInfo
    console.warn = mockedWarn
    console.error = mockedError
    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })
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
    publish = jest.fn()
  })
  beforeEach(async () => {
    user = await collections.users.save({
      userName: 'test.account@istio.actually.exists',
      emailValidated: true,
      tfaSendMethod: 'email',
    })
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
    domain = await collections.domains.save({
      domain: 'test.gc.ca',
      lastRan: null,
      selectors: [],
      cvdEnrollment: storedCvdEnrollment,
    })
  })
  afterEach(async () => {
    consoleOutput.length = 0
    await truncate()
  })
  afterAll(async () => {
    await drop()
  })

  const buildContext = () => ({
    i18n,
    query,
    collections: collectionNames,
    transaction,
    publish,
    userKey: user._key,
    request: { ip: '127.0.0.1' },
    auth: {
      checkDomainPermission: checkDomainPermission({
        i18n,
        userKey: user._key,
        query,
      }),
      checkPermission: checkPermission({ userKey: user._key, query }),
      userRequired: userRequired({
        userKey: user._key,
        loadUserByKey: loadUserByKey({ query }),
      }),
      verifiedRequired: verifiedRequired({}),
      tfaRequired: tfaRequired({}),
    },
    dataSources: {
      auth: new AuthDataSource({ query, userKey: user._key }),
    },
    validators: {
      cleanseInput,
      slugify,
    },
    loaders: {
      loadDkimSelectorsByDomainId: loadDkimSelectorsByDomainId({
        query,
        userKey: user._key,
        cleanseInput,
        i18n,
        auth: { loginRequiredBool: true },
      }),
      loadDomainByKey: loadDomainByKey({ query }),
      loadOrgByKey: loadOrgByKey({ query, language: 'en' }),
      loadUserByKey: loadUserByKey({ query }),
    },
  })

  const runMutation = ({ fields, domainId = toGlobalId('domain', domain._key), orgId = toGlobalId('organization', org._key) }) =>
    graphql({
      schema,
      source: `
        mutation {
          updateCvdEnrollment (
            input: {
              domainId: "${domainId}"
              orgId: "${orgId}"
              ${fields}
            }
          ) {
            result {
              ... on Domain {
                id
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
      contextValue: buildContext(),
    })

  const loadStoredCvdEnrollment = async () => (await loadDomainByKey({ query }).load(domain._key)).cvdEnrollment

  const loadAuditLogs = async () => {
    const cursor = await query`FOR log IN auditLogs RETURN log`
    return cursor.all()
  }

  const affiliate = (permission) => collections.affiliations.save({ _to: user._id, _from: org._id, permission })
  const claim = () =>
    collections.claims.save({ _to: domain._id, _from: org._id, tags: [], assetState: 'monitor-only' })
  const own = () => collections.ownership.save({ _to: domain._id, _from: org._id })

  const permissionDenied = {
    data: {
      updateCvdEnrollment: {
        result: {
          code: 403,
          description: 'Permission Denied: Please contact organization user for help with updating this domain.',
        },
      },
    },
  }

  describe('given an admin of an org that claims and owns the domain', () => {
    beforeEach(async () => {
      await affiliate('admin')
      await claim()
      await own()
    })

    it('updates a single field and preserves the others', async () => {
      const response = await runMutation({ fields: 'description: "Updated description"' })

      expect(response).toEqual({
        data: { updateCvdEnrollment: { result: { id: toGlobalId('domain', domain._key) } } },
      })
      expect(await loadStoredCvdEnrollment()).toEqual({ ...storedCvdEnrollment, description: 'Updated description' })
    })

    it('updates all fields and stores internal enum values', async () => {
      const response = await runMutation({
        fields: `
          status: DENY
          description: "Owned asset"
          maxSeverity: CRITICAL
          confidentialityRequirement: LOW
          integrityRequirement: HIGH
          availabilityRequirement: LOW
        `,
      })

      expect(response.errors).toBeUndefined()
      expect(await loadStoredCvdEnrollment()).toEqual({
        status: 'deny',
        description: 'Owned asset',
        maxSeverity: 'critical',
        confidentialityRequirement: 'low',
        integrityRequirement: 'high',
        availabilityRequirement: 'low',
      })
    })

    it('ignores fields explicitly set to null', async () => {
      const response = await runMutation({ fields: 'status: DENY, description: null' })

      expect(response.errors).toBeUndefined()
      expect(await loadStoredCvdEnrollment()).toEqual({ ...storedCvdEnrollment, status: 'deny' })
    })

    it('keeps other fields when status is set to NOT_ENROLLED', async () => {
      const response = await runMutation({ fields: 'status: NOT_ENROLLED' })

      expect(response.errors).toBeUndefined()
      expect(await loadStoredCvdEnrollment()).toEqual({ ...storedCvdEnrollment, status: 'not-enrolled' })
    })

    it('returns a 400 error and warns when no cvdEnrollment fields are provided', async () => {
      const response = await runMutation({ fields: '' })

      expect(response).toEqual({
        data: {
          updateCvdEnrollment: {
            result: { code: 400, description: 'No CVD enrollment fields were provided to update.' },
          },
        },
      })
      expect(consoleOutput).toEqual([
        `User: ${user._key} attempted to update cvdEnrollment for domain: ${domain._key} with no fields provided.`,
      ])
      expect(await loadStoredCvdEnrollment()).toEqual(storedCvdEnrollment)
    })

    it('writes an audit log entry when status changes', async () => {
      await runMutation({ fields: 'status: DENY' })

      const logs = await loadAuditLogs()
      expect(logs).toHaveLength(1)
      expect(logs[0].target.updatedProperties).toEqual([
        { name: 'cvdEnrollment', oldValue: 'enrolled', newValue: 'deny' },
      ])
      expect(logs[0].initiatedBy.ipAddress).toEqual('127.0.0.1')
    })

    it('does not write an audit log entry when only description changes', async () => {
      await runMutation({ fields: 'description: "Only the description"' })

      expect(await loadAuditLogs()).toEqual([])
    })

    it('returns a 400 error for an unknown domain', async () => {
      const response = await runMutation({ fields: 'status: DENY', domainId: toGlobalId('domain', '1') })

      expect(response).toEqual({
        data: { updateCvdEnrollment: { result: { code: 400, description: 'Unable to update unknown domain.' } } },
      })
    })

    it('returns a 400 error for an unknown org', async () => {
      const response = await runMutation({ fields: 'status: DENY', orgId: toGlobalId('organization', '1') })

      expect(response).toEqual({
        data: {
          updateCvdEnrollment: { result: { code: 400, description: 'Unable to update domain in an unknown org.' } },
        },
      })
      expect(await loadStoredCvdEnrollment()).toEqual(storedCvdEnrollment)
    })
  })

  describe('given an admin of an org that claims but does not own the domain', () => {
    beforeEach(async () => {
      await affiliate('admin')
      await claim()
    })

    it('returns a 403 error and does not update the domain', async () => {
      const response = await runMutation({ fields: 'status: DENY' })

      expect(response).toEqual(permissionDenied)
      expect(consoleOutput).toEqual([
        `User: ${user._key} attempted to update cvdEnrollment for domain: ${domain._key} for org: ${org._key}, however that org does not have ownership of that domain.`,
      ])
      expect(await loadStoredCvdEnrollment()).toEqual(storedCvdEnrollment)
    })
  })

  describe('given an admin of an org that claims the domain and is affiliated with an unrelated verified org that owns a different domain', () => {
    let otherOrg, otherDomain

    beforeEach(async () => {
      await affiliate('admin')
      await claim()
      // Ownership of a different domain by a different verified org must not grant
      // ownership of `domain` (guards against the old checkDomainOwnership false-positive).
      otherOrg = await collections.organizations.save({
        verified: true,
        orgDetails: {
          en: {
            slug: 'other-org',
            acronym: 'OO',
            name: 'Other Org',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
          fr: {
            slug: 'autre-org',
            acronym: 'AO',
            name: 'Autre Org',
            zone: 'FED',
            sector: 'TBS',
            country: 'Canada',
            province: 'Ontario',
            city: 'Ottawa',
          },
        },
      })
      otherDomain = await collections.domains.save({ domain: 'other.gc.ca', lastRan: null, selectors: [] })
      await collections.ownership.save({ _to: otherDomain._id, _from: otherOrg._id })
      await collections.affiliations.save({ _to: user._id, _from: otherOrg._id, permission: 'admin' })
    })

    it('returns a 403 error and does not update the domain', async () => {
      const ownershipCursor = await query`
        FOR edge IN ownership
          FILTER edge._from == ${otherOrg._id} AND edge._to == ${otherDomain._id}
          RETURN edge
      `
      expect(await ownershipCursor.all()).toHaveLength(1)

      const response = await runMutation({ fields: 'status: DENY' })

      expect(response).toEqual(permissionDenied)
      expect(consoleOutput).toEqual([
        `User: ${user._key} attempted to update cvdEnrollment for domain: ${domain._key} for org: ${org._key}, however that org does not have ownership of that domain.`,
      ])
      expect(await loadStoredCvdEnrollment()).toEqual(storedCvdEnrollment)
    })
  })

  describe('given an admin of an org with no claim to the domain', () => {
    beforeEach(async () => {
      await affiliate('admin')
    })

    it('returns a 400 error and does not update the domain', async () => {
      const response = await runMutation({ fields: 'status: DENY' })

      expect(response).toEqual({
        data: {
          updateCvdEnrollment: {
            result: {
              code: 400,
              description: 'Unable to update domain that does not belong to the given organization.',
            },
          },
        },
      })
      expect(await loadStoredCvdEnrollment()).toEqual(storedCvdEnrollment)
    })
  })

  describe('given a user-level member of an org that claims and owns the domain', () => {
    beforeEach(async () => {
      await affiliate('user')
      await claim()
      await own()
    })

    it('returns a 403 error and does not update the domain', async () => {
      const response = await runMutation({ fields: 'status: DENY' })

      expect(response).toEqual(permissionDenied)
      expect(await loadStoredCvdEnrollment()).toEqual(storedCvdEnrollment)
    })
  })
})
