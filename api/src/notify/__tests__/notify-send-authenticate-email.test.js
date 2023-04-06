import {setupI18n} from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import {sendAuthEmail} from '../index'

const {NOTIFICATION_AUTHENTICATE_EMAIL_ID} = process.env

describe('given the sendAuthEmail function', () => {
  let i18n
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
    i18n = setupI18n({
      locale: 'en',
      localeData: {
        en: {plurals: {}},
        fr: {plurals: {}},
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

      const mockedSendAuthEmail = sendAuthEmail({notifyClient, i18n})
      await mockedSendAuthEmail({user})

      expect(notifyClient.sendEmail).toHaveBeenCalledWith(
        NOTIFICATION_AUTHENTICATE_EMAIL_ID,
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
  describe('language is set to english', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'en',
        localeData: {
          en: {plurals: {}},
          fr: {plurals: {}},
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
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
          tfaCode: 123456,
        }

        try {
          const mockedSendAuthEmail = sendAuthEmail({notifyClient, i18n})
          await mockedSendAuthEmail({user})
        } catch (err) {
          expect(err).toEqual(
            new Error('Unable to send authentication email. Please try again.'),
          )
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending authentication code via email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
  describe('language is set to french', () => {
    beforeAll(() => {
      i18n = setupI18n({
        locale: 'fr',
        localeData: {
          en: {plurals: {}},
          fr: {plurals: {}},
        },
        locales: ['en', 'fr'],
        messages: {
          en: englishMessages.messages,
          fr: frenchMessages.messages,
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
          tfaCode: 123456,
        }

        try {
          const mockedSendAuthEmail = sendAuthEmail({notifyClient, i18n})
          await mockedSendAuthEmail({user})
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible d'envoyer l'email d'authentification. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending authentication code via email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
