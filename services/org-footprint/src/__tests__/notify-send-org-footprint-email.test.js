const { sendOrgFootprintEmail } = require('../notify')

const makeFakeLogger = () => ({
  calls: { info: [], warn: [], error: [] },
  info(...args) {
    this.calls.info.push(args)
  },
  warn(...args) {
    this.calls.warn.push(args)
  },
  error(...args) {
    this.calls.error.push(args)
  },
})

const makeFakeNotifyClient = (failWith) => ({
  calls: [],
  async sendEmail(...args) {
    this.calls.push(args)
    if (failWith) throw failWith
  },
})

const log = (action, resourceType, resource) => ({ action, target: { resourceType, resource } })

describe('sendOrgFootprintEmail', () => {
  const templateId = 'footprint-template'
  const user = { _key: 'user-1', userName: 'tracker+user@tbs-sct.gc.ca', displayName: 'Test Account' }
  const orgNames = { en: 'Test Org', fr: 'Le Test Org' }

  const zeroCounts = {
    add_users_count: 0,
    update_users_count: 0,
    remove_users_count: 0,
    add_domains_count: 0,
    add_domains_list: '',
    update_domains_count: 0,
    update_domains_list: '',
    remove_domains_count: 0,
    remove_domains_list: '',
  }

  it.each([
    ['no audit logs gives zero counts and empty lists', [], {}],
    [
      'counts users and lists domains per action',
      [
        log('add', 'user'),
        log('add', 'user'),
        log('remove', 'domain', 'domain1'),
        log('update', 'domain', 'domain2'),
      ],
      {
        add_users_count: 2,
        update_domains_count: 1,
        update_domains_list: 'domain2',
        remove_domains_count: 1,
        remove_domains_list: 'domain1',
      },
    ],
    [
      'joins multiple domains with a comma and space',
      [log('add', 'domain', 'a.gc.ca'), log('add', 'domain', 'b.gc.ca'), log('update', 'user')],
      { add_domains_count: 2, add_domains_list: 'a.gc.ca, b.gc.ca', update_users_count: 1 },
    ],
  ])('sends the template with personalisation: %s', async (_name, auditLogs, expected) => {
    const notifyClient = makeFakeNotifyClient()
    const logger = makeFakeLogger()

    await expect(
      sendOrgFootprintEmail({ notifyClient, templateId, logger, user, auditLogs, orgNames }),
    ).resolves.toBeUndefined()

    expect(notifyClient.calls).toEqual([
      [
        templateId,
        user.userName,
        {
          personalisation: {
            display_name: user.displayName,
            organization_name_en: 'Test Org',
            organization_name_fr: 'Le Test Org',
            ...zeroCounts,
            ...expected,
          },
        },
      ],
    ])
    expect(logger.calls.error).toEqual([])
  })

  it('logs the error with the user key and does not throw when sending fails', async () => {
    const err = new Error('notify down')
    const notifyClient = makeFakeNotifyClient(err)
    const logger = makeFakeLogger()

    await expect(
      sendOrgFootprintEmail({ notifyClient, templateId, logger, user, auditLogs: [], orgNames }),
    ).resolves.toBeUndefined()

    expect(logger.calls.error).toEqual([
      [{ err, userKey: 'user-1' }, 'Error occurred when sending org footprint changes via email'],
    ])
  })
})
