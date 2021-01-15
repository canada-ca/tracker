import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendAuthEmail } from '../index'

describe('given the sendAuthEmail function', () => {
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
        tfaCode: 123456,
      }

      const mockedSendAuthEmail = sendAuthEmail(notifyClient, i18n)
      await mockedSendAuthEmail({ user })

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
          tfaCode: 123456,
        }

        try {
          const mockedSendAuthEmail = sendAuthEmail(notifyClient, i18n)
          await mockedSendAuthEmail({ user })
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
          tfaCode: 123456,
        }

        try {
          const mockedSendAuthEmail = sendAuthEmail(notifyClient, i18n)
          await mockedSendAuthEmail({ user })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending authentication code via email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
