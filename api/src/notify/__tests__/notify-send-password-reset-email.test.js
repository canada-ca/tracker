import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendPasswordResetEmail } from '../index'

const { NOTIFICATION_PASSWORD_RESET_BILINGUAL } = process.env

describe('given the sendPasswordResetEmail function', () => {
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
          userName: 'test@email.ca',
          displayName: 'Test Account',
        }

        const mockedSendPasswordResetEmail = sendPasswordResetEmail({
          notifyClient,
          i18n,
        })
        await mockedSendPasswordResetEmail({
          user,
          resetUrl: 'reset.url',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_PASSWORD_RESET_BILINGUAL, user.userName, {
          personalisation: {
            user: user.displayName,
            password_reset_url: 'reset.url',
          },
        })
      })
    })
    describe('an error occurs while sending email', () => {
      it('throws an error message', async () => {
        const sendEmail = jest.fn().mockRejectedValue(new Error('Notification error occurred.'))
        const notifyClient = {
          sendEmail,
        }

        const user = {
          userName: 'test@email.ca',
          displayName: 'Test Account',
        }

        try {
          const mockedSendPasswordResetEmail = sendPasswordResetEmail({
            notifyClient,
            i18n,
          })
          await mockedSendPasswordResetEmail({
            user,
            resetUrl: 'reset.url',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Unable to send password reset email. Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending password reset email for ${user._key}: Error: Notification error occurred.`,
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
          userName: 'test@email.ca',
          displayName: 'Test Account',
        }

        const mockedSendPasswordResetEmail = sendPasswordResetEmail({
          notifyClient,
          i18n,
        })
        await mockedSendPasswordResetEmail({
          user,
          resetUrl: 'reset.url',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_PASSWORD_RESET_BILINGUAL, user.userName, {
          personalisation: {
            user: user.displayName,
            password_reset_url: 'reset.url',
          },
        })
      })
    })
    describe('an error occurs while sending email', () => {
      it('throws an error message', async () => {
        const sendEmail = jest.fn().mockRejectedValue(new Error('Notification error occurred.'))
        const notifyClient = {
          sendEmail,
        }

        const user = {
          userName: 'test@email.ca',
          displayName: 'Test Account',
        }

        try {
          const mockedSendPasswordResetEmail = sendPasswordResetEmail({
            notifyClient,
            i18n,
          })
          await mockedSendPasswordResetEmail({
            user,
            resetUrl: 'reset.url',
          })
        } catch (err) {
          expect(err).toEqual(
            new Error("Impossible d'envoyer l'email de réinitialisation du mot de passe. Veuillez réessayer."),
          )
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending password reset email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
