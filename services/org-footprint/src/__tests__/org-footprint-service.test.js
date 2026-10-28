const {
  DB_PASS: rootPass,
  DB_URL: url,
  NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
  NOTIFICATION_PENDING_USERS,
  NOTIFICATION_API_KEY,
  NOTIFICATION_API_URL,
} = process.env

process.env.REDIRECT_TO_SERVICE_ACCOUNT_EMAIL = 'false'
process.env.SERVICE_ACCOUNT_EMAIL = 'tracker+service-account@tbs-sct.gc.ca'

const { dbNameFromFile } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')
const logger = require('../logger')
const { orgFootprintService } = require('..')

const notifyResult = ({ value }) =>
  value.then(
    ({ status }) => status,
    ({ response }) => response.data,
  )

describe('given the orgFootprintService function', () => {
  let query, drop, truncate, collections, notifyClient

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url,
      rootPassword: rootPass,
      options: [
        ...databaseOptions({ rootPass }),
        { type: 'documentcollection', name: 'domains' },
        { type: 'edgecollection', name: 'claims' },
      ],
    }))
  })

  beforeEach(async () => {
    await truncate()
    notifyClient = new NotifyClient(NOTIFICATION_API_URL, NOTIFICATION_API_KEY)
    jest.spyOn(notifyClient, 'sendEmail')
    jest.spyOn(logger, 'warn')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await drop()
  })

  it('emails members, admins and owners, skipping pending users and ownerless orgs', async () => {
    const org = await collections.organizations.save({
      orgDetails: { en: { name: 'Test Org' }, fr: { name: 'Le Test Org' } },
    })
    const owner = await collections.users.save({
      userName: 'tracker+owner@tbs-sct.gc.ca',
      displayName: 'Owner',
      emailUpdateOptions: { orgFootprint: false },
    })
    const user = await collections.users.save({
      userName: 'tracker+user@tbs-sct.gc.ca',
      displayName: 'User',
      emailUpdateOptions: { orgFootprint: true },
    })
    const pending = await collections.users.save({
      userName: 'tracker+pending@tbs-sct.gc.ca',
      displayName: 'Pending',
      emailUpdateOptions: { orgFootprint: true },
    })
    await collections.affiliations.save({ _from: org._id, _to: owner._id, permission: 'owner' })
    await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'user' })
    await collections.affiliations.save({ _from: org._id, _to: pending._id, permission: 'pending' })
    await collections.auditLogs.save({
      timestamp: new Date().toISOString(),
      action: 'add',
      target: { resource: 'new.test.gc.ca', resourceType: 'domain', organization: { id: org._key } },
    })
    const domain = await collections.domains.save({ domain: 'new.test.gc.ca' })
    await collections.claims.save({ _from: org._id, _to: domain._id })

    const ownerlessOrg = await collections.organizations.save({
      orgDetails: { en: { name: 'Ownerless Org' }, fr: { name: 'Org Sans Propriétaire' } },
    })
    const ownerlessDomain = await collections.domains.save({
      domain: 'ownerless.test.gc.ca',
    })
    await collections.claims.save({ _from: ownerlessOrg._id, _to: ownerlessDomain._id })

    await orgFootprintService({ query, notifyClient })

    expect(notifyClient.sendEmail.mock.calls).toEqual([
      [
        NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
        'tracker+user@tbs-sct.gc.ca',
        {
          personalisation: {
            display_name: 'User',
            organization_name_en: 'Test Org',
            organization_name_fr: 'Le Test Org',
            add_users_count: 0,
            update_users_count: 0,
            remove_users_count: 0,
            add_domains_count: 1,
            add_domains_list: 'new.test.gc.ca',
            update_domains_count: 0,
            update_domains_list: '',
            remove_domains_count: 0,
            remove_domains_list: '',
          },
        },
      ],
      [
        NOTIFICATION_PENDING_USERS,
        'tracker+owner@tbs-sct.gc.ca',
        {
          personalisation: {
            display_name: 'Owner',
            organization_name_en: 'Test Org',
            organization_name_fr: 'Le Test Org',
            admin_link: 'https://tracker.canada.ca/admin/organizations',
          },
        },
      ],
    ])
  })

  it('also emails the service account when REDIRECT_TO_SERVICE_ACCOUNT_EMAIL is true in any case', async () => {
    process.env.REDIRECT_TO_SERVICE_ACCOUNT_EMAIL = 'TRUE'
    let redirectingService
    jest.isolateModules(() => {
      ;({ orgFootprintService: redirectingService } = require('..'))
    })
    process.env.REDIRECT_TO_SERVICE_ACCOUNT_EMAIL = 'false'

    const org = await collections.organizations.save({
      orgDetails: { en: { name: 'Test Org' }, fr: { name: 'Le Test Org' } },
    })
    const user = await collections.users.save({
      userName: 'tracker+user@tbs-sct.gc.ca',
      displayName: 'User',
      emailUpdateOptions: { orgFootprint: true },
    })
    await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'user' })
    await collections.auditLogs.save({
      timestamp: new Date().toISOString(),
      action: 'add',
      target: { resource: 'new.test.gc.ca', resourceType: 'domain', organization: { id: org._key } },
    })

    await redirectingService({ query, notifyClient })

    const personalisation = {
      organization_name_en: 'Test Org',
      organization_name_fr: 'Le Test Org',
      add_users_count: 0,
      update_users_count: 0,
      remove_users_count: 0,
      add_domains_count: 1,
      add_domains_list: 'new.test.gc.ca',
      update_domains_count: 0,
      update_domains_list: '',
      remove_domains_count: 0,
      remove_domains_list: '',
    }
    expect(notifyClient.sendEmail.mock.calls).toEqual([
      [
        NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
        'tracker+user@tbs-sct.gc.ca',
        { personalisation: { display_name: 'User', ...personalisation } },
      ],
      [
        NOTIFICATION_ORG_FOOTPRINT_BILINGUAL,
        'tracker+service-account@tbs-sct.gc.ca',
        { personalisation: { display_name: 'Service Account', ...personalisation } },
      ],
    ])
    expect(await Promise.all(notifyClient.sendEmail.mock.results.map(notifyResult))).toEqual([201, 201])
  })
})
