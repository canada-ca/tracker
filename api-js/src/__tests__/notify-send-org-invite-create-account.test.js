const dotenv = require('dotenv-safe')
dotenv.config()
const { sendOrgInviteCreateAccount } = require('../notify')

describe('given the sendOrgInviteCreateAccount function', () => {
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

      await sendOrgInviteCreateAccount({
        templateId: 'test_id',
        user,
        orgName: 'Test Org',
        createAccountLink: 'TestLink.ca',
        notifyClient,
      })

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(
        'test_id',
        user.userName,
        {
          personalisation: {
            create_account_link: 'TestLink.ca',
            display_name: user.userName,
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
        await sendOrgInviteCreateAccount({
          templateId: 'test_id',
          user,
          orgName: 'Test Org',
          createAccountLink: 'TestLink.ca',
          notifyClient,
        })
      } catch (err) {
        expect(err).toEqual(
          new Error('Unable to send org invite email. Please try again.'),
        )
      }

      expect(consoleOutput).toEqual([
        `Error ocurred when sending org create account invite email for ${user._key}: Error: Notification error occurred.`,
      ])
    })
  })
})
