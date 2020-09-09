const dotenv = require('dotenv-safe')
dotenv.config()
const { sendPasswordResetEmail } = require('../notify')

describe('given the sendPasswordResetEmail function', () => {
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
        userName: 'test@email.ca',
        displayName: 'Test Account',
      }

      await sendPasswordResetEmail({
        templateId: 'test_id',
        user,
        resetUrl: 'reset.url',
        notifyClient,
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(
        'test_id',
        user.userName,
        {
          personalisation: {
            user: user.displayName,
            password_reset_url: 'reset.url',
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
        userName: 'test@email.ca',
        displayName: 'Test Account',
      }

      try {
        await sendPasswordResetEmail({
          templateId: 'test_id',
          user,
          resetUrl: 'reset.url',
          notifyClient,
        })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to send password reset email. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending password reset email for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
