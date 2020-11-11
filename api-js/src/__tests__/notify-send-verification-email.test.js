const { setupI18n } = require('@lingui/core')

const englishMessages = require('../locale/en/messages')
const frenchMessages = require('../locale/fr/messages')
const { sendVerificationEmail } = require('../notify')

describe('given the sendVerificationEmail function', () => {
  let i18n
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
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

      const mockedSendVerificationEmail = sendVerificationEmail(
        notifyClient,
        i18n,
      )
      await mockedSendVerificationEmail({
        templateId: 'test-id',
        verifyUrl: 'verify.url',
        user,
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
          userName: 'test.email@email.ca',
          displayName: 'Test Account',
        }

        try {
          const mockedSendVerificationEmail = sendVerificationEmail(
            notifyClient,
            i18n,
          )
          await mockedSendVerificationEmail({
            templateId: 'test-id',
            verifyUrl: 'verify.url',
            user,
          })
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
          userName: 'test.email@email.ca',
          displayName: 'Test Account',
        }

        try {
          const mockedSendVerificationEmail = sendVerificationEmail(
            notifyClient,
            i18n,
          )
          await mockedSendVerificationEmail({
            templateId: 'test-id',
            verifyUrl: 'verify.url',
            user,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending verification email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
