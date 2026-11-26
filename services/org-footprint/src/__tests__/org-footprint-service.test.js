const http = require('http')
const { NotifyClient } = require('notifications-node-client')
const { dbNameFromFile } = require('arango-tools')
const { ensureDatabase: ensure } = require('../testUtilities')
const { databaseOptions } = require('../../database-options')
const { createLogger } = require('../../logger')
const { buildConfig } = require('../../config')
const { orgFootprintService } = require('..')

const {
  DB_PASS: rootPass,
  DB_URL: url,
  NOTIFICATION_PENDING_USERS: PENDING_USERS_TEMPLATE,
  NOTIFICATION_ORG_FOOTPRINT_BILINGUAL: ORG_FOOTPRINT_TEMPLATE,
  NOTIFICATION_NEW_CVD_ENROLLMENTS: CVD_ENROLLMENT_TEMPLATE,
  NOTIFICATION_ADMIN_LINK: ADMIN_LINK,
  SERVICE_ACCOUNT_EMAIL: SERVICE_ACCOUNT,
} = process.env

const member = (name, permission, { orgFootprint = true } = {}) => ({ name, permission, orgFootprint })
const byRecipient = (a, b) => a.recipient.localeCompare(b.recipient)
const sentWith = (sent, templateId) => sent.filter((email) => email.templateId === templateId)
const failureWarning = (failures) => [{ failures }, 'Run completed with failures']

const closeServer = (server) =>
  new Promise((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
    server.closeAllConnections()
  })

/**
 * Local HTTP server that speaks enough of the Notify API for the real NotifyClient to talk to it.
 * It records every email request and answers 201, or 500 while `rejectSends` is on.
 */
const startNotifyServer = async () => {
  const state = { requests: [], rejectSends: false }
  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })
    req.on('end', () => {
      const payload = JSON.parse(body)
      state.requests.push({
        templateId: payload.template_id,
        recipient: payload.email_address,
        personalisation: payload.personalisation,
      })
      const status = state.rejectSends ? 500 : 201
      const response = state.rejectSends ? { errors: [{ error: 'Exception', message: 'Notify is down' }] } : { id: 'x' }
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(response))
    })
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  return {
    state,
    url: `http://127.0.0.1:${server.address().port}`,
    close: () => closeServer(server),
  }
}

const assetLog = { action: 'add', target: { resourceType: 'domain', resource: 'new.gc.ca' } }
const scanLog = { action: 'scan', target: { resourceType: 'domain', resource: 'scanned.gc.ca' } }
const exportLog = { action: 'export', target: { resourceType: 'org', resource: 'exported' } }
const cvdLog = {
  action: 'update',
  target: {
    resource: 'cvd.gc.ca',
    resourceType: 'domain',
    updatedProperties: [{ name: 'cvdEnrollment', oldValue: 'not-enrolled', newValue: 'enrolled' }],
  },
}

describe('given the orgFootprintService function', () => {
  const dbName = dbNameFromFile(__filename)
  const logger = createLogger({ level: 'silent', env: 'test' })
  let query, drop, truncate, collections, notify

  beforeAll(async () => {
    notify = await startNotifyServer()
    ;({ query, drop, truncate, collections } = await ensure({
      type: 'database',
      name: dbName,
      url,
      rootPassword: rootPass,
      options: databaseOptions({ rootPass }),
    }))
  })

  beforeEach(async () => {
    await truncate()
    notify.state.requests = []
    notify.state.rejectSends = false
    jest.spyOn(logger, 'warn')
    jest.spyOn(logger, 'error')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    if (notify) await notify.close()
    if (drop) await drop()
  })

  /** Saves an org with its members and audit logs, and returns the org key and each member's user key. */
  const createOrg = async ({ members = [], auditLogs = [] } = {}) => {
    const org = await collections.organizations.save({
      orgDetails: { en: { name: 'Org' }, fr: { name: 'Organisation' } },
    })
    const userKeys = {}
    for (const { name, permission, orgFootprint } of members) {
      const user = await collections.users.save({
        userName: `${name}@test.ca`,
        displayName: name,
        emailUpdateOptions: { orgFootprint },
      })
      await collections.affiliations.save({ _from: org._id, _to: user._id, permission })
      userKeys[name] = user._key
    }
    for (const log of auditLogs) {
      await collections.auditLogs.save({
        timestamp: new Date().toISOString(),
        initiatedBy: { userName: 'admin@test.ca' },
        ...log,
        target: { ...log.target, organization: { id: org._key, name: 'Org' } },
      })
    }
    return { orgKey: org._key, userKeys }
  }

  /** Runs the service against the real database and the real NotifyClient pointed at the local Notify server. */
  const run = async ({ redirect = false } = {}) => {
    const config = buildConfig({
      ...process.env,
      DB_NAME: dbName,
      NOTIFICATION_API_URL: notify.url,
      REDIRECT_TO_SERVICE_ACCOUNT_EMAIL: String(redirect),
    })
    const notifyClient = new NotifyClient(config.notify.apiUrl, config.notify.apiKey)

    const failures = await orgFootprintService({ config, logger, query, notifyClient })
    return { failures, sent: [...notify.state.requests] }
  }

  describe('failure count', () => {
    const cases = [
      {
        name: 'a clean run that sends emails',
        arrange: () => createOrg({ members: [member('ann', 'user')], auditLogs: [assetLog] }),
      },
      { name: 'a run where every step is skipped', arrange: () => createOrg() },
    ]

    it.each(cases)('returns 0 and logs no warning for $name', async ({ arrange }) => {
      await arrange()

      const { failures } = await run()

      expect(failures).toBe(0)
      expect(logger.warn).not.toHaveBeenCalled()
    })
  })

  describe('org footprint emails', () => {
    it('sends one email per opted-in user with display_name and the footprint template', async () => {
      await createOrg({ members: [member('ann', 'user'), member('bob', 'admin')], auditLogs: [assetLog] })

      const { sent } = await run()

      expect(sent.sort(byRecipient).map(({ templateId, recipient }) => ({ templateId, recipient }))).toEqual([
        { templateId: ORG_FOOTPRINT_TEMPLATE, recipient: 'ann@test.ca' },
        { templateId: ORG_FOOTPRINT_TEMPLATE, recipient: 'bob@test.ca' },
      ])
      expect(sent[0].personalisation).toEqual({
        display_name: 'ann',
        organization_name_en: 'Org',
        organization_name_fr: 'Organisation',
        add_users_count: 0,
        update_users_count: 0,
        remove_users_count: 0,
        add_domains_count: 1,
        add_domains_list: 'new.gc.ca',
        update_domains_count: 0,
        update_domains_list: '',
        remove_domains_count: 0,
        remove_domains_list: '',
      })
    })

    it('adds the service account as a recipient when redirect is true', async () => {
      await createOrg({ members: [member('ann', 'user')], auditLogs: [assetLog] })

      const { sent } = await run({ redirect: true })

      expect(sent.map(({ recipient }) => recipient)).toEqual(['ann@test.ca', SERVICE_ACCOUNT])
      expect(sent[1].personalisation.display_name).toBe('Service Account')
    })

    it('skips users who opted out and users who are still pending', async () => {
      await createOrg({
        members: [
          member('ann', 'user'),
          member('opted-out', 'user', { orgFootprint: false }),
          member('waiting', 'pending'),
        ],
        auditLogs: [assetLog],
      })

      const { sent } = await run()

      expect(sentWith(sent, ORG_FOOTPRINT_TEMPLATE).map(({ recipient }) => recipient)).toEqual(['ann@test.ca'])
    })

    const skippedCases = [
      { name: 'there are no logs', auditLogs: [] },
      { name: 'logs are scan and export only', auditLogs: [scanLog, exportLog] },
    ]

    it.each(skippedCases)('sends no footprint email when $name', async ({ auditLogs }) => {
      await createOrg({ members: [member('ann', 'user')], auditLogs })

      const { sent } = await run()

      expect(sentWith(sent, ORG_FOOTPRINT_TEMPLATE)).toEqual([])
    })
  })

  describe('pending users emails', () => {
    it('emails each admin and owner with org names and the admin link', async () => {
      await createOrg({
        members: [member('pending-user', 'pending'), member('adm1', 'admin'), member('adm2', 'owner')],
      })

      const { sent } = await run()

      expect(sent.sort(byRecipient)).toEqual([
        {
          templateId: PENDING_USERS_TEMPLATE,
          recipient: 'adm1@test.ca',
          personalisation: {
            display_name: 'adm1',
            organization_name_en: 'Org',
            organization_name_fr: 'Organisation',
            admin_link: ADMIN_LINK,
          },
        },
        expect.objectContaining({ templateId: PENDING_USERS_TEMPLATE, recipient: 'adm2@test.ca' }),
      ])
    })

    it('sends no email when there are no pending users', async () => {
      await createOrg({ members: [member('adm1', 'admin')] })

      const { sent } = await run()

      expect(sent).toEqual([])
    })
  })

  describe('footprint and pending emails across orgs', () => {
    it('emails members, admins and owners, skipping pending users and ownerless orgs', async () => {
      await createOrg({
        members: [
          member('owner', 'owner', { orgFootprint: false }),
          member('user', 'user'),
          member('pending', 'pending'),
        ],
        auditLogs: [assetLog],
      })
      await createOrg({ auditLogs: [assetLog] })

      const { failures, sent } = await run()

      expect(failures).toBe(0)
      expect(sent.sort(byRecipient).map(({ templateId, recipient }) => ({ templateId, recipient }))).toEqual([
        { templateId: PENDING_USERS_TEMPLATE, recipient: 'owner@test.ca' },
        { templateId: ORG_FOOTPRINT_TEMPLATE, recipient: 'user@test.ca' },
      ])
    })
  })

  describe('CVD enrollment email', () => {
    it('sends one email to the service account with the enrollment count', async () => {
      await createOrg({ auditLogs: [cvdLog] })
      await createOrg({ auditLogs: [cvdLog] })

      const { failures, sent } = await run()

      expect(failures).toBe(0)
      expect(sent).toHaveLength(1)
      expect(sent[0]).toMatchObject({
        templateId: CVD_ENROLLMENT_TEMPLATE,
        recipient: SERVICE_ACCOUNT,
        personalisation: { enrollments_count: 2 },
      })
      expect(sent[0].personalisation.enrollments_list).toContain('# cvd.gc.ca')
    })

    it('sends no email when there are no domain update logs', async () => {
      await createOrg({ auditLogs: [assetLog] })

      const { sent } = await run()

      expect(sentWith(sent, CVD_ENROLLMENT_TEMPLATE)).toEqual([])
    })
  })

  describe('sendEmail rejection', () => {
    const cases = [
      {
        name: 'org footprint',
        arrange: async () => {
          const { userKeys } = await createOrg({ members: [member('ann', 'user')], auditLogs: [assetLog] })
          return userKeys.ann
        },
        message: 'Error occurred when sending org footprint changes via email',
      },
      {
        name: 'pending users',
        arrange: async () => {
          const { userKeys } = await createOrg({ members: [member('pending-user', 'pending'), member('adm', 'admin')] })
          return userKeys.adm
        },
        message: 'Error occurred when sending pending users alert via email',
      },
      {
        name: 'CVD enrollment',
        arrange: async () => {
          await createOrg({ auditLogs: [cvdLog] })
          return 'service-account'
        },
        message: 'Failed to send new CVD enrollments email',
      },
    ]

    it.each(cases)('logs err and userKey and counts a failed $name email', async ({ arrange, message }) => {
      const userKey = await arrange()
      notify.state.rejectSends = true

      const { failures } = await run()

      expect(failures).toBe(1)
      expect(logger.warn.mock.calls).toEqual([failureWarning(1)])
      expect(logger.error.mock.calls).toEqual([
        [{ err: expect.objectContaining({ response: expect.objectContaining({ status: 500 }) }), userKey }, message],
      ])
    })

    it('keeps sending to remaining users and counts each failed recipient', async () => {
      const { userKeys } = await createOrg({
        members: [member('pending-user', 'pending'), member('adm-a', 'admin'), member('adm-b', 'admin')],
      })
      notify.state.rejectSends = true

      const { failures, sent } = await run()

      expect(failures).toBe(2)
      expect(sent).toHaveLength(2)
      expect(logger.error.mock.calls.map(([{ userKey }]) => userKey).sort()).toEqual(
        [userKeys['adm-a'], userKeys['adm-b']].sort(),
      )
    })
  })
})
