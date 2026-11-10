const { sendNewCVDEnrollmentsEmail } = require('../notify')

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

const makeFakeClient = (failWith) => ({
  calls: [],
  async sendEmail(...args) {
    this.calls.push(args)
    if (failWith) throw failWith
  },
})

describe('sendNewCVDEnrollmentsEmail', () => {
  const templateId = 'template-123'
  const email = 'recipient@example.gc.ca'
  const payload = { enrollments_table: '| a |', enrollments_count: 1 }

  it('sends the payload as personalisation to the given template and address', async () => {
    const client = makeFakeClient()
    const logger = makeFakeLogger()

    await expect(sendNewCVDEnrollmentsEmail({ logger, client, templateId, payload, email })).resolves.toBeUndefined()

    expect(client.calls).toEqual([[templateId, email, { personalisation: payload }]])
    expect(logger.calls.error).toEqual([])
  })

  it('logs the client failure and does not throw', async () => {
    const err = new Error('notify down')
    const client = makeFakeClient(err)
    const logger = makeFakeLogger()

    await expect(sendNewCVDEnrollmentsEmail({ logger, client, templateId, payload, email })).resolves.toBeUndefined()

    expect(logger.calls.error).toEqual([[{ err }, 'Failed to send new CVD enrollments email']])
  })
})
