import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendTfaTextMsg } from '../index'

describe('given the sendTfaTextMsg function', () => {
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

      const mockedSendTfaTextMsg = sendTfaTextMsg(notifyClient, i18n)
      await mockedSendTfaTextMsg({
        templateId: 'test-id',
        phoneNumber: user.phoneNumber,
        user,
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
          const mockedSendTfaTextMsg = sendTfaTextMsg(notifyClient, i18n)
          await mockedSendTfaTextMsg({
            templateId: 'test-id',
            phoneNumber: user.phoneNumber,
            user,
          })
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
          const mockedSendTfaTextMsg = sendTfaTextMsg(notifyClient, i18n)
          await mockedSendTfaTextMsg({
            templateId: 'test-id',
            phoneNumber: user.phoneNumber,
            user,
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending two factor authentication message for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
