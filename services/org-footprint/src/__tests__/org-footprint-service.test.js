const { orgFootprintService } = require('../org-footprint-service')

const config = {
  redirect: false,
  serviceAccount: 'service@test.ca',
  logTimeWindow: 86400000,
  notify: {
    adminLink: 'https://tracker.test/admin',
    templates: {
      pendingUsers: 'pending-users-template',
      orgFootprint: 'org-footprint-template',
      cvdEnrollment: 'cvd-enrollment-template',
    },
  },
}

const assetLog = { action: 'add', target: { resourceType: 'domain', resource: 'new.gc.ca' } }
const scanLog = { action: 'scan', target: { resourceType: 'domain', resource: 'scanned.gc.ca' } }
const exportLog = { action: 'export', target: { resourceType: 'org', resource: 'exported' } }
const cvdLog = {
  action: 'update',
  timestamp: '2026-11-12T00:00:00.000Z',
  initiatedBy: { userName: 'admin@test.ca' },
  target: {
    resource: 'cvd.gc.ca',
    resourceType: 'domain',
    organization: { id: '1', name: 'Org One' },
    updatedProperties: [{ name: 'cvdEnrollment', newValue: 'enrolled' }],
  },
}

const user = (name) => ({ _key: `key-${name}`, userName: `${name}@test.ca`, displayName: name })

const buildOrg = (overrides = {}) => ({
  names: { en: 'Org', fr: 'Organisation' },
  auditLogs: [],
  users: [],
  pending: [],
  admins: [],
  ...overrides,
})

/** Fake tagged-template `query` routed by distinctive query text. Failures are Error values on the data. */
const createFakeQuery = ({ orgs = {}, domainLogs = [] }) => {
  const cursorOf = (data) => {
    if (data instanceof Error) throw data
    return { all: async () => data, next: async () => data }
  }
  return async (strings, ...values) => {
    const text = strings.join('?')
    const orgKey = String(values[0]).replace('organizations/', '')
    if (text.includes('RETURN org._key')) return cursorOf(Object.keys(orgs))
    if (text.includes('org.orgDetails')) return cursorOf(orgs[orgKey].names)
    if (text.includes('target.organization.id')) return cursorOf(orgs[orgKey].auditLogs)
    if (text.includes("resourceType == 'domain'")) return cursorOf(domainLogs)
    if (text.includes('"pending"')) return cursorOf(orgs[orgKey].pending)
    if (text.includes('"admin" OR')) return cursorOf(orgs[orgKey].admins)
    if (text.includes('orgFootprint')) return cursorOf(orgs[orgKey].users)
    throw new Error(`Unrouted query: ${text}`)
  }
}

const createFakeNotifyClient = ({ failWith } = {}) => {
  const sent = []
  return {
    sent,
    sendEmail: async (templateId, recipient, options) => {
      if (failWith) throw failWith
      sent.push({ templateId, recipient, personalisation: options.personalisation })
    },
  }
}

const createFakeLogger = () => {
  const calls = { info: [], warn: [], error: [] }
  return {
    calls,
    info: (...args) => calls.info.push(args),
    warn: (...args) => calls.warn.push(args),
    error: (...args) => calls.error.push(args),
  }
}

const run = async ({ db, configOverrides = {}, notifyOptions } = {}) => {
  const notifyClient = createFakeNotifyClient(notifyOptions)
  const logger = createFakeLogger()
  const failures = await orgFootprintService({
    config: { ...config, ...configOverrides },
    logger,
    query: createFakeQuery(db),
    notifyClient,
  })
  return { sent: notifyClient.sent, logger, failures }
}

const sentWith = (sent, templateId) => sent.filter((email) => email.templateId === templateId)

const failureWarning = (failures) => [{ failures }, 'Run completed with failures']

describe('orgFootprintService', () => {
  describe('failure count', () => {
    it.each([
      {
        name: 'a clean run that sends emails',
        db: { orgs: { 1: buildOrg({ auditLogs: [assetLog], users: [user('ann')] }) } },
      },
      { name: 'a run where every step is skipped', db: { orgs: { 1: buildOrg() }, domainLogs: [] } },
    ])('returns 0 and logs no warning for $name', async ({ db }) => {
      const { failures, logger } = await run({ db })

      expect(failures).toBe(0)
      expect(logger.calls.warn).toEqual([])
    })
  })

  describe('org footprint emails', () => {
    it('sends one email per user with display_name and the footprint template', async () => {
      const db = { orgs: { 1: buildOrg({ auditLogs: [assetLog], users: [user('ann'), user('bob')] }) } }

      const { sent } = await run({ db })

      expect(sent).toHaveLength(2)
      expect(sent.map(({ templateId, recipient }) => ({ templateId, recipient }))).toEqual([
        { templateId: 'org-footprint-template', recipient: 'ann@test.ca' },
        { templateId: 'org-footprint-template', recipient: 'bob@test.ca' },
      ])
      expect(sent[0].personalisation).toMatchObject({
        display_name: 'ann',
        organization_name_en: 'Org',
        organization_name_fr: 'Organisation',
        add_domains_count: 1,
        add_domains_list: 'new.gc.ca',
      })
    })

    it('adds the service account as a recipient when redirect is true', async () => {
      const db = { orgs: { 1: buildOrg({ auditLogs: [assetLog], users: [user('ann')] }) } }

      const { sent } = await run({ db, configOverrides: { redirect: true } })

      expect(sent.map(({ recipient }) => recipient)).toEqual(['ann@test.ca', 'service@test.ca'])
      expect(sent[1].personalisation.display_name).toBe('Service Account')
    })

    it.each([
      { name: 'there are no logs', auditLogs: [] },
      { name: 'logs are scan and export only', auditLogs: [scanLog, exportLog] },
    ])('sends no footprint email when $name', async ({ auditLogs }) => {
      const db = { orgs: { 1: buildOrg({ auditLogs, users: [user('ann')] }) } }

      const { sent } = await run({ db })

      expect(sentWith(sent, 'org-footprint-template')).toEqual([])
    })
  })

  describe('pending users emails', () => {
    it('emails each admin with org names and the admin link', async () => {
      const db = { orgs: { 1: buildOrg({ pending: [user('p')], admins: [user('adm1'), user('adm2')] }) } }

      const { sent } = await run({ db })

      expect(sent).toEqual([
        {
          templateId: 'pending-users-template',
          recipient: 'adm1@test.ca',
          personalisation: {
            display_name: 'adm1',
            organization_name_en: 'Org',
            organization_name_fr: 'Organisation',
            admin_link: 'https://tracker.test/admin',
          },
        },
        expect.objectContaining({ templateId: 'pending-users-template', recipient: 'adm2@test.ca' }),
      ])
    })

    it('sends no email when there are no pending users', async () => {
      const db = { orgs: { 1: buildOrg({ pending: [], admins: [user('adm1')] }) } }

      const { sent } = await run({ db })

      expect(sent).toEqual([])
    })
  })

  describe('CVD enrollment email', () => {
    it('sends one email to the service account with the enrollment count', async () => {
      const db = { orgs: { 1: buildOrg(), 2: buildOrg() }, domainLogs: [cvdLog, cvdLog] }

      const { sent } = await run({ db })

      expect(sent).toHaveLength(1)
      expect(sent[0]).toMatchObject({
        templateId: 'cvd-enrollment-template',
        recipient: 'service@test.ca',
        personalisation: { enrollments_count: 2 },
      })
      expect(sent[0].personalisation.enrollments_list).toContain('# cvd.gc.ca')
    })

    it('sends no email when there are no domain update logs', async () => {
      const db = { orgs: { 1: buildOrg() }, domainLogs: [] }

      const { sent } = await run({ db })

      expect(sentWith(sent, 'cvd-enrollment-template')).toEqual([])
    })
  })

  describe('failure isolation', () => {
    it('continues with the next org and the CVD step when one footprint step fails', async () => {
      const db = {
        orgs: {
          1: buildOrg({ auditLogs: new Error('db down') }),
          2: buildOrg({ auditLogs: [assetLog], users: [user('ann')] }),
        },
        domainLogs: [cvdLog],
      }

      const { sent, logger, failures } = await run({ db })

      expect(failures).toBe(1)
      expect(logger.calls.warn).toEqual([failureWarning(1)])
      expect(sent.map(({ templateId }) => templateId)).toEqual(['org-footprint-template', 'cvd-enrollment-template'])
      expect(logger.calls.error).toEqual([
        [{ err: expect.any(Error), orgKey: '1' }, 'Failed to process org footprint notification.'],
      ])
    })

    it('logs and skips only the org whose names fail to load', async () => {
      const db = {
        orgs: {
          1: buildOrg({ names: new Error('no names'), auditLogs: [assetLog], users: [user('ann')] }),
          2: buildOrg({ auditLogs: [assetLog], users: [user('bob')] }),
        },
      }

      const { sent, logger, failures } = await run({ db })

      expect(failures).toBe(1)
      expect(logger.calls.warn).toEqual([failureWarning(1)])
      expect(sent.map(({ recipient }) => recipient)).toEqual(['bob@test.ca'])
      expect(logger.calls.error).toEqual([
        [{ orgKey: '1', err: expect.any(Error) }, 'Failed to fetch org names, skipping org...'],
      ])
    })

    it('logs a failure when pending users lookup throws and still runs the CVD step', async () => {
      const db = { orgs: { 1: buildOrg({ pending: new Error('boom') }) }, domainLogs: [cvdLog] }

      const { sent, logger, failures } = await run({ db })

      expect(failures).toBe(1)
      expect(sentWith(sent, 'cvd-enrollment-template')).toHaveLength(1)
      expect(logger.calls.error).toEqual([
        [{ err: expect.any(Error), orgKey: '1' }, 'Failed to process pending users notifications.'],
      ])
    })

    it('logs a failure when the CVD domain log lookup throws', async () => {
      const db = { orgs: { 1: buildOrg() }, domainLogs: new Error('boom') }

      const { logger, failures } = await run({ db })

      expect(failures).toBe(1)
      expect(logger.calls.error).toEqual([
        [{ err: expect.any(Error) }, 'Failed to process new CVD enrollments notifications.'],
      ])
    })
  })

  describe('sendEmail rejection', () => {
    const sendError = new Error('notify down')
    const cases = [
      {
        name: 'org footprint',
        db: { orgs: { 1: buildOrg({ auditLogs: [assetLog], users: [user('ann')] }) } },
        userKey: 'key-ann',
        message: 'Error occurred when sending org footprint changes via email',
      },
      {
        name: 'pending users',
        db: { orgs: { 1: buildOrg({ pending: [user('p')], admins: [user('adm')] }) } },
        userKey: 'key-adm',
        message: 'Error occurred when sending pending users alert via email',
      },
      {
        name: 'CVD enrollment',
        db: { orgs: { 1: buildOrg() }, domainLogs: [cvdLog] },
        userKey: 'service-account',
        message: 'Failed to send new CVD enrollments email',
      },
    ]

    it.each(cases)('logs err and userKey and counts a failed $name email', async ({ db, userKey, message }) => {
      const { logger, failures } = await run({ db, notifyOptions: { failWith: sendError } })

      expect(failures).toBe(1)
      expect(logger.calls.warn).toEqual([failureWarning(1)])
      expect(logger.calls.error).toEqual([[{ err: sendError, userKey }, message]])
    })

    it('keeps sending to remaining users and counts each failed recipient', async () => {
      const db = { orgs: { 1: buildOrg({ pending: [user('p')], admins: [user('a'), user('b')] }) } }

      const { logger, failures } = await run({ db, notifyOptions: { failWith: sendError } })

      expect(failures).toBe(2)
      expect(logger.calls.error.map(([{ userKey }]) => userKey)).toEqual(['key-a', 'key-b'])
    })
  })
})
