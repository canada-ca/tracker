const { sendPendingOrgUsersEmail } = require('../notify')

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

describe('sendPendingOrgUsersEmail', () => {
  const templateId = 'pending-template'
  const user = { _key: 'user-2', userName: 'admin@tbs-sct.gc.ca', displayName: 'Admin Account' }
  const orgNames = { en: 'Test Org', fr: 'Le Test Org' }

  it('sends the template with org names and the admin link', async () => {
    const notifyClient = makeFakeNotifyClient()
    const logger = makeFakeLogger()

    await expect(sendPendingOrgUsersEmail({ notifyClient, templateId, logger, user, orgNames })).resolves.toBeUndefined()

    expect(notifyClient.calls).toEqual([
      [
        templateId,
        user.userName,
        {
          personalisation: {
            display_name: 'Admin Account',
            organization_name_en: 'Test Org',
            organization_name_fr: 'Le Test Org',
            admin_link: 'https://tracker.canada.ca/admin/organizations',
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

    await expect(sendPendingOrgUsersEmail({ notifyClient, templateId, logger, user, orgNames })).resolves.toBeUndefined()

    expect(logger.calls.error).toEqual([
      [{ err, userKey: 'user-2' }, 'Error occurred when sending pending users alert via email'],
    ])
  })
})
