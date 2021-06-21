import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendOrgInviteEmail } from '../index'

const { NOTIFICATION_ORG_INVITE_EN, NOTIFICATION_ORG_INVITE_FR } = process.env

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
          preferredLang: 'english',
        }

        const mockedSendOrgInviteEmail = sendOrgInviteEmail({
          notifyClient,
          i18n,
        })
        await mockedSendOrgInviteEmail({
          user,
          orgName: 'Test Org',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(
          NOTIFICATION_ORG_INVITE_EN,
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
          preferredLang: 'english',
        }

        try {
          const mockedSendOrgInviteEmail = sendOrgInviteEmail({
            notifyClient,
            i18n,
          })
          await mockedSendOrgInviteEmail({
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
    describe('email successfully sent', () => {
      it('returns nothing', async () => {
        const sendEmail = jest.fn()
        const notifyClient = {
          sendEmail,
        }

        const user = {
          userName: 'test@email.ca',
          displayName: 'Test Account',
          preferredLang: 'french',
        }

        const mockedSendOrgInviteEmail = sendOrgInviteEmail({
          notifyClient,
          i18n,
        })
        await mockedSendOrgInviteEmail({
          user,
          orgName: 'Test Org',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(
          NOTIFICATION_ORG_INVITE_FR,
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
          preferredLang: 'french',
        }

        try {
          const mockedSendOrgInviteEmail = sendOrgInviteEmail({
            notifyClient,
            i18n,
          })
          await mockedSendOrgInviteEmail({
            user,
            orgName: 'Test Org',
          })
        } catch (err) {
          expect(err).toEqual(
            new Error(
              "Impossible d'envoyer l'e-mail d'invitation à l'org. Veuillez réessayer.",
            ),
          )
        }

        expect(consoleOutput).toEqual([
          `Error ocurred when sending org invite email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
