const { dbNameFromFile } = require('arango-tools')
const { NotifyClient } = require('notifications-node-client')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')
const { buildConfig } = require('../../config')
const { createLogger } = require('../../logger')
const { orgFootprintService } = require('..')

const notifyResult = ({ value }) =>
  value.then(
    ({ status }) => status,
    (error) => error.response?.data ?? error.code ?? error.message,
  )

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000).toISOString()

describe('given the orgFootprintService function', () => {
  const config = buildConfig({ ...process.env, REDIRECT_TO_SERVICE_ACCOUNT_EMAIL: 'false' })
  const logger = createLogger({ level: 'silent', env: 'test' })
  let query, drop, truncate, collections, notifyClient

  const saveOrg = () =>
    collections.organizations.save({
      orgDetails: { en: { name: 'Test Org' }, fr: { name: 'Le Test Org' } },
    })

  const saveOptedInUser = async (org) => {
    const user = await collections.users.save({
      userName: 'tracker+user@tbs-sct.gc.ca',
      displayName: 'User',
      emailUpdateOptions: { orgFootprint: true },
    })
    await collections.affiliations.save({ _from: org._id, _to: user._id, permission: 'user' })
  }

  const saveDomainAddLog = (org) =>
    collections.auditLogs.save({
      timestamp: new Date().toISOString(),
      action: 'add',
      target: { resource: 'new.test.gc.ca', resourceType: 'domain', organization: { id: org._key } },
    })

  const saveCvdEnrollmentChangeLog = (org, { timestamp, oldValue, newValue }) =>
    collections.auditLogs.save({
      timestamp,
      action: 'update',
      initiatedBy: { id: 'admin-id', userName: 'tracker+admin@tbs-sct.gc.ca', role: 'admin' },
      target: {
        resource: 'cvd.test.gc.ca',
        resourceType: 'domain',
        organization: { id: org._key, name: 'Test Org' },
        updatedProperties: [{ name: 'cvdEnrollment', oldValue, newValue }],
      },
    })

  const saveCvdEnrollmentChanges = async () => {
    const org = await saveOrg()
    await saveOptedInUser(org)
    await saveCvdEnrollmentChangeLog(org, { timestamp: minutesAgo(10), oldValue: 'not-enrolled', newValue: 'enrolled' })
    await saveCvdEnrollmentChangeLog(org, { timestamp: minutesAgo(5), oldValue: 'enrolled', newValue: 'not-enrolled' })
  }

  const footprintPersonalisation = {
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

  const cvdUpdateFootprintCall = [
    config.notify.templates.orgFootprint,
    'tracker+user@tbs-sct.gc.ca',
    {
      personalisation: {
        ...footprintPersonalisation,
        display_name: 'User',
        add_domains_count: 0,
        add_domains_list: '',
        update_domains_count: 2,
        update_domains_list: 'cvd.test.gc.ca, cvd.test.gc.ca',
      },
    },
  ]

  beforeAll(async () => {
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbNameFromFile(__filename),
      url: config.db.url,
      rootPassword: config.db.rootPassword,
      options: databaseOptions({ rootPass: config.db.rootPassword }),
    }))
  })

  beforeEach(async () => {
    await truncate()
    notifyClient = new NotifyClient(config.notify.apiUrl, config.notify.apiKey)
    jest.spyOn(notifyClient, 'sendEmail')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await drop()
  })

  it('emails opted-in members the org footprint and admins or owners the pending users alert', async () => {
    const org = await saveOrg()
    const owner = await collections.users.save({
      userName: 'tracker+owner@tbs-sct.gc.ca',
      displayName: 'Owner',
      emailUpdateOptions: { orgFootprint: false },
    })
    const pending = await collections.users.save({
      userName: 'tracker+pending@tbs-sct.gc.ca',
      displayName: 'Pending',
      emailUpdateOptions: { orgFootprint: true },
    })
    await collections.affiliations.save({ _from: org._id, _to: owner._id, permission: 'owner' })
    await collections.affiliations.save({ _from: org._id, _to: pending._id, permission: 'pending' })
    await saveOptedInUser(org)
    await saveDomainAddLog(org)

    const failures = await orgFootprintService({ config, logger, query, notifyClient })

    expect(notifyClient.sendEmail.mock.calls).toEqual([
      [
        config.notify.templates.orgFootprint,
        'tracker+user@tbs-sct.gc.ca',
        { personalisation: { display_name: 'User', ...footprintPersonalisation } },
      ],
      [
        config.notify.templates.pendingUsers,
        'tracker+owner@tbs-sct.gc.ca',
        {
          personalisation: {
            display_name: 'Owner',
            organization_name_en: 'Test Org',
            organization_name_fr: 'Le Test Org',
            admin_link: config.notify.adminLink,
          },
        },
      ],
    ])
    expect(await Promise.all(notifyClient.sendEmail.mock.results.map(notifyResult))).toEqual([201, 201])
    expect(failures).toBe(0)
  })

  it('also emails the service account the org footprint when redirect is enabled in any letter case', async () => {
    const redirectConfig = buildConfig({ ...process.env, REDIRECT_TO_SERVICE_ACCOUNT_EMAIL: 'TRUE' })
    const org = await saveOrg()
    await saveOptedInUser(org)
    await saveDomainAddLog(org)

    const failures = await orgFootprintService({ config: redirectConfig, logger, query, notifyClient })

    expect(notifyClient.sendEmail.mock.calls).toEqual([
      [
        redirectConfig.notify.templates.orgFootprint,
        'tracker+user@tbs-sct.gc.ca',
        { personalisation: { display_name: 'User', ...footprintPersonalisation } },
      ],
      [
        redirectConfig.notify.templates.orgFootprint,
        redirectConfig.serviceAccount,
        { personalisation: { display_name: 'Service Account', ...footprintPersonalisation } },
      ],
    ])
    expect(await Promise.all(notifyClient.sendEmail.mock.results.map(notifyResult))).toEqual([201, 201])
    expect(failures).toBe(0)
  })

  it('emails the service account one block per CVD enrollment change, including un-enrollments', async () => {
    await saveCvdEnrollmentChanges()

    const failures = await orgFootprintService({ config, logger, query, notifyClient })

    expect(notifyClient.sendEmail.mock.calls).toEqual([
      cvdUpdateFootprintCall,
      [
        config.notify.templates.cvdEnrollment,
        config.serviceAccount,
        { personalisation: { enrollments_count: 2, enrollments_list: expect.stringContaining('# cvd.test.gc.ca') } },
      ],
    ])
    const enrollmentsList = notifyClient.sendEmail.mock.calls[1][2].personalisation.enrollments_list
    expect(enrollmentsList).toContain('* Organization: Test Org')
    expect(enrollmentsList).toContain('* Status: enrolled')
    expect(enrollmentsList).toContain('* Status: not-enrolled')
    expect(enrollmentsList).toContain('* Initiated by: tracker+admin@tbs-sct.gc.ca')
    expect(await Promise.all(notifyClient.sendEmail.mock.results.map(notifyResult))).toEqual([201, 201])
    expect(failures).toBe(0)
  })

  it('counts a failure and still sends the org footprint when Notify rejects the CVD enrollment email', async () => {
    const badTemplateConfig = {
      ...config,
      notify: {
        ...config.notify,
        templates: { ...config.notify.templates, cvdEnrollment: '00000000-0000-0000-0000-000000000000' },
      },
    }
    await saveCvdEnrollmentChanges()

    const failures = await orgFootprintService({ config: badTemplateConfig, logger, query, notifyClient })

    expect(notifyClient.sendEmail.mock.calls).toEqual([
      cvdUpdateFootprintCall,
      [
        '00000000-0000-0000-0000-000000000000',
        config.serviceAccount,
        { personalisation: { enrollments_count: 2, enrollments_list: expect.any(String) } },
      ],
    ])
    const [footprintResult, cvdResult] = await Promise.all(notifyClient.sendEmail.mock.results.map(notifyResult))
    expect(footprintResult).toBe(201)
    expect(cvdResult).toEqual({
      status_code: 400,
      errors: [{ error: 'BadRequestError', message: 'Template not found' }],
    })
    expect(failures).toBe(1)
  })
})
