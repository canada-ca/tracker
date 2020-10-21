const dotenv = require('dotenv-safe')
dotenv.config()

const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { sendOrgInviteCreateAccount } = require('../notify')

describe('given the sendOrgInviteCreateAccount function', () => {
  let i18n
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
  })

  beforeEach(async () => {
    consoleOutput = []
    i18n = setupI18n({
      language: 'en',
      locales: ['en', 'fr'],
      missing: 'Traduction manquante',
      catalogs: {
        en: englishMessages,
        fr: frenchMessages,
      },
    })
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

      const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount(i18n)
      await mockedSendOrgInviteCreateAccount({
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
  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'en',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
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
          const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount(i18n)
          await mockedSendOrgInviteCreateAccount({
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
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        language: 'fr',
        locales: ['en', 'fr'],
        missing: 'Traduction manquante',
        catalogs: {
          en: englishMessages,
          fr: frenchMessages,
        },
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
          const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount(i18n)
          await mockedSendOrgInviteCreateAccount({
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
})
