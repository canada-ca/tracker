import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendOrgInviteEmail } from '../index'

describe('given the sendOrgInviteEmail function', () => {
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

      const mockedSendOrgInviteEmail = sendOrgInviteEmail(notifyClient, i18n)
      await mockedSendOrgInviteEmail({
        templateId: 'test_id',
        user,
        orgName: 'Test Org',
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
          const mockedSendOrgInviteEmail = sendOrgInviteEmail(
            notifyClient,
            i18n,
          )
          await mockedSendOrgInviteEmail({
            templateId: 'test_id',
            user,
            orgName: 'Test Org',
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
          const mockedSendOrgInviteEmail = sendOrgInviteEmail(
            notifyClient,
            i18n,
          )
          await mockedSendOrgInviteEmail({
            templateId: 'test_id',
            user,
            orgName: 'Test Org',
          })
        } catch (err) {
          expect(err).toEqual(new Error('todo'))
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending org invite email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
