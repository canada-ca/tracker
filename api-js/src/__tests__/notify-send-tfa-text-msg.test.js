const dotenv = require('dotenv-safe')
dotenv.config()
const { sendTfaTextMsg } = require('../notify')

describe('given the sendTfaTextMsg function', () => {
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
  })

  beforeEach(async () => {
    consoleOutput = []
  })

  describe('text message successfully sent', () => {
    it('returns nothing', async () => {
      const sendSms = jest.fn()
      const notifyClient = {
        sendSms,
      }
      const user = {
        phoneNumber: '+12345678901',
        tfaCode: 123456,
      }

      await sendTfaTextMsg({
        templateId: 'test-id',
        phoneNumber: user.phoneNumber,
        user,
        notifyClient,
      })

      expect(notifyClient.sendSms).toHaveBeenCalledWith(
        'test-id',
        user.phoneNumber,
        {
          personalisation: {
            verify_code: user.tfaCode,
          },
        },
      )
    })
  })
  describe('an error occurs while sending text message', () => {
    it('throws an error message', async () => {
      const sendSms = jest
        .fn()
        .mockRejectedValue(new Error('Notification error occurred.'))
      const notifyClient = {
        sendSms,
      }
      const user = {
        phoneNumber: '+12345678901',
        tfaCode: 123456,
      }

      try {
        await sendTfaTextMsg({ user, notifyClient })
      } catch (err) {
        expect(err).toEqual(
          new Error(
            'Unable to send two factor authentication message. Please try again.',
          ),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending two factor authentication message for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
