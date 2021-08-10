import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendVerificationEmail } from '../index'

const {
  NOTIFICATION_VERIFICATION_EMAIL_EN,
  NOTIFICATION_VERIFICATION_EMAIL_FR,
} = process.env

describe('given the sendVerificationEmail function', () => {
  let i18n
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    i18n = setupI18n({
      locale: 'en',
      localeData: {
        en: { plurals: {} },
        fr: { plurals: {} },
      },
      locales: ['en', 'fr'],
      messages: {
        en: englishMessages.messages,
        fr: frenchMessages.messages,
      },
    })
  })

  beforeEach(async () => {
    consoleOutput = []
  })
  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: {
          en: { plurals: {} },
          fr: { plurals: {} },
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
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
          userName: 'test.email@email.ca',
          displayName: 'Test Account',
          preferredLang: 'english',
        }

        const mockedSendVerificationEmail = sendVerificationEmail({
          notifyClient,
          i18n,
        })
        await mockedSendVerificationEmail({
          verifyUrl: 'verify.url',
          user,
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(
          NOTIFICATION_VERIFICATION_EMAIL_EN,
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
          preferredLang: 'english',
        }

        try {
          const mockedSendVerificationEmail = sendVerificationEmail({
            notifyClient,
            i18n,
          })
          await mockedSendVerificationEmail({
            verifyUrl: 'verify.url',
            user,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to send verification email. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending verification email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
        localeData: {
          en: { plurals: {} },
          fr: { plurals: {} },
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
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
          userName: 'test.email@email.ca',
          displayName: 'Test Account',
          preferredLang: 'french',
        }

        const mockedSendVerificationEmail = sendVerificationEmail({
          notifyClient,
          i18n,
        })
        await mockedSendVerificationEmail({
          verifyUrl: 'verify.url',
          user,
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(
          NOTIFICATION_VERIFICATION_EMAIL_FR,
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
          preferredLang: 'french',
        }

        try {
          const mockedSendVerificationEmail = sendVerificationEmail({
            notifyClient,
            i18n,
          })
          await mockedSendVerificationEmail({
            verifyUrl: 'verify.url',
            user,
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible d'envoyer l'email de vérification. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending verification email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
