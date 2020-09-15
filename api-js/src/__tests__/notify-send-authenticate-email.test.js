const dotenv = require('dotenv-safe')
dotenv.config()
const { sendAuthEmail } = require('../notify')

describe('given the sendAuthEmail function', () => {
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
        tfaCode: 123456,
      }

      await sendAuthEmail({ user, notifyClient })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(
        'a517d99f-ddb2-4494-87e1-d5ae6ca53090',
        user.userName,
        {
          personalisation: {
            user: user.displayName,
            tfa_code: user.tfaCode,
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
        tfaCode: 123456,
      }

      try {
        await sendAuthEmail({ user, notifyClient })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to authenticate. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending authentication code via email for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
