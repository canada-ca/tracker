import crypto from 'crypto'
import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendAuthTextMsg } from '../index'

const { CIPHER_KEY, NOTIFICATION_AUTHENTICATE_TEXT_ID } = process.env

describe('given the sendAuthTextMsg function', () => {
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
      const phoneDetails = {
        iv: crypto.randomBytes(12).toString('hex'),
      }
      const cipher = crypto.createCipheriv(
        'aes-256-ccm',
        String(CIPHER_KEY),
        Buffer.from(phoneDetails.iv, 'hex'),
        { authTagLength: 16 },
      )
      let encrypted = cipher.update('+12345678901', 'utf8', 'hex')
      encrypted += cipher.final('hex')

      phoneDetails.phoneNumber = encrypted
      phoneDetails.tag = cipher.getAuthTag().toString('hex')

      const user = {
        phoneNumber: '+12345678901',
        tfaCode: 123456,
        phoneDetails,
      }

      const mockedSendAuthTextMsg = sendAuthTextMsg({ notifyClient, i18n })
      await mockedSendAuthTextMsg({ user })

      expect(notifyClient.sendSms).toHaveBeenCalledWith(
        NOTIFICATION_AUTHENTICATE_TEXT_ID,
        user.phoneNumber,
        {
          personalisation: {
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
        const phoneDetails = {
          iv: crypto.randomBytes(12).toString('hex'),
        }
        const cipher = crypto.createCipheriv(
          'aes-256-ccm',
          String(CIPHER_KEY),
          Buffer.from(phoneDetails.iv, 'hex'),
          { authTagLength: 16 },
        )
        let encrypted = cipher.update('+12345678901', 'utf8', 'hex')
        encrypted += cipher.final('hex')

        phoneDetails.phoneNumber = encrypted
        phoneDetails.tag = cipher.getAuthTag().toString('hex')

        const user = {
          phoneNumber: '+12345678901',
          tfaCode: 123456,
          phoneDetails,
        }

        try {
          const mockedSendAuthTextMsg = sendAuthTextMsg({ notifyClient, i18n })
          await mockedSendAuthTextMsg({ user })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              'Unable to send authentication text message. Please try again.',
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending authentication code via text for ${user._key}: Error: Notification error occurred.`,
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
        const phoneDetails = {
          iv: crypto.randomBytes(12).toString('hex'),
        }
        const cipher = crypto.createCipheriv(
          'aes-256-ccm',
          String(CIPHER_KEY),
          Buffer.from(phoneDetails.iv, 'hex'),
          { authTagLength: 16 },
        )
        let encrypted = cipher.update('+12345678901', 'utf8', 'hex')
        encrypted += cipher.final('hex')

        phoneDetails.phoneNumber = encrypted
        phoneDetails.tag = cipher.getAuthTag().toString('hex')

        const user = {
          phoneNumber: '+12345678901',
          tfaCode: 123456,
          phoneDetails,
        }

        try {
          const mockedSendAuthTextMsg = sendAuthTextMsg({ notifyClient, i18n })
          await mockedSendAuthTextMsg({ user })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible d'envoyer un message texte d'authentification. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending authentication code via text for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
