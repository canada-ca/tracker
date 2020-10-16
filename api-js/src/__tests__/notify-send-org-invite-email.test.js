const dotenv = require('dotenv-safe')
dotenv.config()
const { sendOrgInviteEmail } = require('../notify')

describe('given the sendOrgInviteEmail function', () => {
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

      await sendOrgInviteEmail({
        templateId: 'test_id',
        user,
        orgName: 'Test Org',
        notifyClient,
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(
        'test_id',
        user.userName,
        {
          personalisation: {
            display_name: user.displayName,
            organization_name: 'Test Org',
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
        await sendOrgInviteEmail({
          templateId: 'test_id',
          user,
          orgName: 'Test Org',
          notifyClient,
        })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to send org invite email. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending org invite email for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
