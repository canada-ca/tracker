const dotenv = require('dotenv-safe')
dotenv.config()
const { sendAuthTextMsg } = require('../notify')

describe('given the sendAuthTextMsg function', () => {
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

      await sendAuthTextMsg({ user, notifyClient })

      expect(notifyClient.sendSms).toHaveBeenCalledWith(
        'bccda53c-278f-4d8c-a8d1-7b58cade2bd8',
        user.phoneNumber,
        {
          personalisation: {
            tfa_code: user.tfaCode,
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
        await sendAuthTextMsg({ user, notifyClient })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to authenticate. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending authentication code via text for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
