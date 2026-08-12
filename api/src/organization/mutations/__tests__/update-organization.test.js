import { setupI18n } from '@lingui/core'
import { graphql, GraphQLSchema } from 'graphql'
import { toGlobalId } from 'graphql-relay'

import { createQuerySchema } from '../../../query'
import { createMutationSchema } from '../../../mutation'
import englishMessages from '../../../locale/en/messages'
import frenchMessages from '../../../locale/fr/messages'
import { cleanseInput, slugify } from '../../../validators'

const ORG_KEY = 'org123'
const ORG_GID = toGlobalId('organization', ORG_KEY)

const BASE_RAW_ORG = {
  _id: `organizations/${ORG_KEY}`,
  _key: ORG_KEY,
  externalId: 'ext-001',
  externallyManaged: false,
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
}

// Flat object returned by byKey.load after the update (language-resolved, as the Organization type expects).
// _type: 'organization' is required by updateOrganizationUnion resolveType.
const RESOLVED_ORG = {
  _type: 'organization',
  id: ORG_KEY,
  _key: ORG_KEY,
  _id: `organizations/${ORG_KEY}`,
  acronym: 'TBS',
  name: 'Treasury Board of Canada Secretariat',
  slug: 'treasury-board-secretariat',
  zone: 'FED',
  sector: 'TBS',
  country: 'Canada',
  province: 'Ontario',
  city: 'Ottawa',
  verified: false,
}

const BASE_USER = { _key: 'user123', userName: 'test@example.com' }

describe('updateOrganization', () => {
  let schema, enI18n, frI18n
  const consoleOutput = []

  beforeAll(() => {
    console.info = (o) => consoleOutput.push(o)
    console.warn = (o) => consoleOutput.push(o)
    console.error = (o) => consoleOutput.push(o)

    schema = new GraphQLSchema({
      query: createQuerySchema(),
      mutation: createMutationSchema(),
    })

    enI18n = setupI18n({
      locale: 'en',
      localeData: { en: { plurals: {} }, fr: { plurals: {} } },
      locales: ['en', 'fr'],
      messages: { en: englishMessages.messages, fr: frenchMessages.messages },
    })

    frI18n = setupI18n({
      locale: 'fr',
      localeData: { en: { plurals: {} }, fr: { plurals: {} } },
      locales: ['en', 'fr'],
      messages: { en: englishMessages.messages, fr: frenchMessages.messages },
    })
  })

  afterEach(() => {
    consoleOutput.length = 0
  })

  // Builds the organization data source mock. firstLoad is what byKey.load returns on the
  // initial existence check; secondLoad is what it returns after the update + cache clear.
  // Note: uses hasOwnProperty so callers can explicitly pass undefined (org not found).
  function makeOrgDS(opts = {}) {
    const firstLoad = Object.prototype.hasOwnProperty.call(opts, 'firstLoad') ? opts.firstLoad : BASE_RAW_ORG
    const secondLoad = opts.secondLoad ?? RESOLVED_ORG
    const nameInUseCount = opts.nameInUseCount ?? 0
    const rawOrg = opts.rawOrg ?? BASE_RAW_ORG
    const update = opts.update ?? jest.fn()
    const checkNameInUse = opts.checkNameInUse ?? null
    const getRawByKey = opts.getRawByKey ?? null

    return {
      byKey: {
        load: jest.fn().mockResolvedValueOnce(firstLoad).mockResolvedValueOnce(secondLoad),
        clear: jest.fn(),
      },
      checkNameInUse: checkNameInUse ?? jest.fn().mockResolvedValue({ count: nameInUseCount }),
      getRawByKey: getRawByKey ?? jest.fn().mockResolvedValue(rawOrg),
      update,
    }
  }

  function makeContext({
    i18n = enI18n,
    permission = 'admin',
    orgDS = null,
    logActivity = jest.fn(),
    userKey = 'user123',
    ip = '1.2.3.4',
  } = {}) {
    return {
      i18n,
      userKey,
      request: { ip },
      auth: {
        userRequired: jest.fn().mockReturnValue(BASE_USER),
        verifiedRequired: jest.fn(),
        checkPermission: jest.fn().mockReturnValue(permission),
      },
      dataSources: {
        auditLogs: { logActivity },
        organization: orgDS ?? makeOrgDS(),
      },
      validators: { cleanseInput, slugify },
    }
  }

  describe('given a successful update', () => {
    it('returns the updated organization on success', async () => {
      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: {
              id: "${ORG_GID}"
              nameEN: "New English Name"
              nameFR: "Nouveau Nom Français"
              acronymEN: "NEN"
              acronymFR: "NNF"
            }) {
              result {
                ... on Organization { id name acronym slug }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext(),
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.updateOrganization.result).toMatchObject({
        name: RESOLVED_ORG.name,
        acronym: RESOLVED_ORG.acronym,
        slug: RESOLVED_ORG.slug,
      })
      expect(consoleOutput).toContain(`User: user123, successfully updated org ${ORG_KEY}.`)
    })

    it('calls update with correctly merged org details', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Updated Name" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          orgKey: ORG_KEY,
          updatedOrgDetails: expect.objectContaining({
            orgDetails: expect.objectContaining({
              en: expect.objectContaining({ name: 'Updated Name' }),
            }),
          }),
        }),
      )
    })

    it('preserves existing fields when only partial inputs are provided', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Only EN Updated" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      const { updatedOrgDetails } = update.mock.calls[0][0]
      expect(updatedOrgDetails.orgDetails.fr.name).toBe(BASE_RAW_ORG.orgDetails.fr.name)
      expect(updatedOrgDetails.orgDetails.en.acronym).toBe(BASE_RAW_ORG.orgDetails.en.acronym)
    })

    it('clears byKey cache before reloading the organization', async () => {
      const clear = jest.fn()
      const orgDS = makeOrgDS()
      orgDS.byKey.clear = clear

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Test" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(clear).toHaveBeenCalledWith(ORG_KEY)
    })
  })

  describe('audit logging', () => {
    it('logs audit activity when nameEN is changed', async () => {
      const logActivity = jest.fn()

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Brand New Name" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ logActivity }),
      })

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'update',
          target: expect.objectContaining({
            resourceType: 'organization',
            updatedProperties: expect.arrayContaining([
              expect.objectContaining({
                name: 'nameEN',
                oldValue: BASE_RAW_ORG.orgDetails.en.name,
                newValue: 'Brand New Name',
              }),
            ]),
          }),
        }),
      )
    })

    it('logs audit activity when nameFR is changed', async () => {
      const logActivity = jest.fn()

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameFR: "Nouveau Nom" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ logActivity }),
      })

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            updatedProperties: expect.arrayContaining([
              expect.objectContaining({ name: 'nameFR', newValue: 'Nouveau Nom' }),
            ]),
          }),
        }),
      )
    })

    it('logs audit activity when acronymEN is changed', async () => {
      const logActivity = jest.fn()

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" acronymEN: "NEW" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ logActivity }),
      })

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            updatedProperties: expect.arrayContaining([
              expect.objectContaining({ name: 'acronymEN', newValue: 'NEW' }),
            ]),
          }),
        }),
      )
    })

    it('logs audit activity when acronymFR is changed', async () => {
      const logActivity = jest.fn()

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" acronymFR: "NVL" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ logActivity }),
      })

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            updatedProperties: expect.arrayContaining([
              expect.objectContaining({ name: 'acronymFR', newValue: 'NVL' }),
            ]),
          }),
        }),
      )
    })

    it('does not log when only zone/sector/location fields are updated', async () => {
      const logActivity = jest.fn()

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" zoneEN: "NEWZONE" sectorEN: "NEWSECTOR" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ logActivity }),
      })

      expect(logActivity).not.toHaveBeenCalled()
    })

    it('populates initiatedBy with user key, userName, role, and IP address', async () => {
      const logActivity = jest.fn()

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Some Name" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ logActivity, ip: '10.0.0.1', permission: 'admin' }),
      })

      expect(logActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          initiatedBy: {
            id: BASE_USER._key,
            userName: BASE_USER.userName,
            role: 'admin',
            ipAddress: '10.0.0.1',
          },
        }),
      )
    })
  })

  describe('super_admin exclusive fields', () => {
    it('super_admin can set externallyManaged to true', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" externallyManaged: true }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'super_admin', orgDS }),
      })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedOrgDetails: expect.objectContaining({ externallyManaged: true }),
        }),
      )
    })

    it('super_admin can set externallyManaged to false', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" externallyManaged: false }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'super_admin', orgDS }),
      })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedOrgDetails: expect.objectContaining({ externallyManaged: false }),
        }),
      )
    })

    it('admin cannot set externallyManaged — field is omitted from update payload', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" externallyManaged: true }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'admin', orgDS }),
      })

      const { updatedOrgDetails } = update.mock.calls[0][0]
      expect(updatedOrgDetails).not.toHaveProperty('externallyManaged')
    })

    it('externallyManaged omitted from input is never set even for super_admin', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "No Managed Field" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'super_admin', orgDS }),
      })

      const { updatedOrgDetails } = update.mock.calls[0][0]
      expect(updatedOrgDetails).not.toHaveProperty('externallyManaged')
    })

    it('super_admin can update externalId', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" externalId: "new-ext-id" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'super_admin', orgDS }),
      })

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedOrgDetails: expect.objectContaining({ externalId: 'new-ext-id' }),
        }),
      )
    })

    it('admin cannot update externalId — field is omitted from update payload', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" externalId: "should-be-ignored" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'admin', orgDS }),
      })

      const { updatedOrgDetails } = update.mock.calls[0][0]
      expect(updatedOrgDetails).not.toHaveProperty('externalId')
    })

    it('super_admin falls back to existing externalId when none is provided', async () => {
      const update = jest.fn()
      const orgDS = makeOrgDS({ update })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Some Name" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'super_admin', orgDS }),
      })

      const { updatedOrgDetails } = update.mock.calls[0][0]
      expect(updatedOrgDetails.externalId).toBe(BASE_RAW_ORG.externalId)
    })
  })

  describe('error: unknown organization', () => {
    it('returns code 400 with correct message (EN) and logs a warning', async () => {
      const orgDS = makeOrgDS({ firstLoad: undefined })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Whatever" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.updateOrganization.result).toEqual({
        code: 400,
        description: 'Unable to update unknown organization.',
      })
      expect(consoleOutput).toContain(
        `User: user123 attempted to update organization: ${ORG_KEY}, however no organizations is associated with that id.`,
      )
    })

    it('returns a translated 400 error (FR)', async () => {
      const orgDS = makeOrgDS({ firstLoad: undefined })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Whatever" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ i18n: frI18n, orgDS }),
      })

      expect(response.data.updateOrganization.result.code).toBe(400)
      expect(response.data.updateOrganization.result.description).not.toBe('Unable to update unknown organization.')
    })
  })

  describe('error: insufficient permission', () => {
    it('returns code 403 with correct message for user role (EN) and logs an error', async () => {
      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Whatever" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: 'user' }),
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.updateOrganization.result).toEqual({
        code: 403,
        description: 'Permission Denied: Please contact organization admin for help with updating organization.',
      })
      expect(consoleOutput).toContain(
        `User: user123 attempted to update organization ${ORG_KEY}, however they do not have the correct permission level. Permission: user`,
      )
    })

    it('returns a translated 403 error for user role (FR)', async () => {
      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Whatever" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ i18n: frI18n, permission: 'user' }),
      })

      expect(response.data.updateOrganization.result.code).toBe(403)
      expect(response.data.updateOrganization.result.description).not.toBe(
        'Permission Denied: Please contact organization admin for help with updating organization.',
      )
    })

    it('returns code 403 for undefined permission (no org affiliation)', async () => {
      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Whatever" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ permission: null }),
      })

      expect(response.data.updateOrganization.result.code).toBe(403)
    })
  })

  describe('error: organization name already in use', () => {
    it('returns code 400 with correct message (EN) and logs an error', async () => {
      const orgDS = makeOrgDS({ nameInUseCount: 1 })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Taken Name" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(response.errors).toBeUndefined()
      expect(response.data.updateOrganization.result).toEqual({
        code: 400,
        description: 'Organization name already in use, please choose another and try again.',
      })
      expect(consoleOutput).toContain(
        `User: user123 attempted to change the name of org: ${ORG_KEY} however it is already in use.`,
      )
    })

    it('returns a translated 400 error when name conflicts (FR)', async () => {
      const orgDS = makeOrgDS({ nameInUseCount: 1 })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Taken Name" }) {
              result {
                ... on OrganizationError { code description }
                ... on Organization { id }
              }
            }
          }
        `,
        contextValue: makeContext({ i18n: frI18n, orgDS }),
      })

      expect(response.data.updateOrganization.result.code).toBe(400)
      expect(response.data.updateOrganization.result.description).not.toBe(
        'Organization name already in use, please choose another and try again.',
      )
    })

    it('skips the name check when neither nameEN nor nameFR is provided', async () => {
      const checkNameInUse = jest.fn()
      const orgDS = makeOrgDS({ checkNameInUse })

      await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" zoneEN: "NewZone" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(checkNameInUse).not.toHaveBeenCalled()
    })
  })

  describe('error: data source failures', () => {
    it('propagates error thrown by organizationDS.update', async () => {
      const orgDS = makeOrgDS({
        update: jest.fn().mockRejectedValue(new Error('Unable to load organization. Please try again.')),
      })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Fail Update" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toBe('Unable to load organization. Please try again.')
    })

    it('propagates error thrown by organizationDS.checkNameInUse', async () => {
      const orgDS = makeOrgDS({
        checkNameInUse: jest.fn().mockRejectedValue(new Error('Unable to update organization. Please try again.')),
      })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" nameEN: "Fail Check" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toBe('Unable to update organization. Please try again.')
    })

    it('propagates error thrown by organizationDS.getRawByKey', async () => {
      const orgDS = makeOrgDS({
        getRawByKey: jest.fn().mockRejectedValue(new Error('Unable to load organization. Please try again.')),
      })

      const response = await graphql({
        schema,
        source: `
          mutation {
            updateOrganization(input: { id: "${ORG_GID}" zoneEN: "FED" }) {
              result {
                ... on Organization { id }
                ... on OrganizationError { code description }
              }
            }
          }
        `,
        contextValue: makeContext({ orgDS }),
      })

      expect(response.errors).toBeDefined()
      expect(response.errors[0].message).toBe('Unable to load organization. Please try again.')
    })
  })
})
