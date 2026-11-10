const { sendNewCVDEnrollmentsEmail } = require('../notify/send-new-cvd-enrollments-email')

const makeFakeClient = (failWith) => {
  const calls = []
  return {
    calls,
    sendEmail: async (...args) => {
      calls.push(args)
      if (failWith) throw failWith
    },
  }
}

describe('sendNewCVDEnrollmentsEmail', () => {
  const templateId = 'template-123'
  const email = 'recipient@example.gc.ca'
  const payload = { enrollments_table: '| a |', enrollments_count: 1 }

  it('sends the payload as personalisation to the given template and address', async () => {
    const client = makeFakeClient()

    await expect(sendNewCVDEnrollmentsEmail({ client, templateId, payload, email })).resolves.toBeUndefined()

    expect(client.calls).toEqual([[templateId, email, { personalisation: payload }]])
  })

  it('wraps a client failure and keeps the original error as cause', async () => {
    const original = new Error('notify down')
    const client = makeFakeClient(original)

    const error = await sendNewCVDEnrollmentsEmail({ client, templateId, payload, email }).catch((e) => e)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe('Failed to send new CVD enrollments email')
    expect(error.cause).toBe(original)
  })
})
