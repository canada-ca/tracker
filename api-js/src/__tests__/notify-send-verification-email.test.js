const dotenv = require('dotenv-safe')
dotenv.config()
const { sendVerificationEmail } = require('../notify')

describe('given the sendVerificationEmail function', () => {
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
  })

  beforeEach(async () => {
    consoleOutput = []
  })

  describe('email successfully sent', () => {
    it('returns nothing', async () => {
      const sendEmail = jest.fn()
      const notifyClient = {
        sendEmail,
      }
      const user = {
        userName: 'test.email@email.ca',
        displayName: 'Test Account',
      }

      await sendVerificationEmail({
        templateId: 'test-id',
        verifyUrl: 'verify.url',
        user,
        notifyClient,
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(
        'test-id',
        user.userName,
        {
          personalisation: {
            user: user.displayName,
            verify_email_url: 'verify.url',
          },
        },
      )
    })
  })
  describe('an error occurs while sending email', () => {
    it('throws an error message', async () => {
      const sendEmail = jest
        .fn()
        .mockRejectedValue(new Error('Notification error occurred.'))
      const notifyClient = {
        sendEmail,
      }
      const user = {
        userName: 'test.email@email.ca',
        displayName: 'Test Account',
      }

      try {
        await sendVerificationEmail({ user, notifyClient })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to send verification email. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending verification email for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
