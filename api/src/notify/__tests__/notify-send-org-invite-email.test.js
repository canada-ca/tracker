import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendOrgInviteEmail } from '../index'

const { NOTIFICATION_ORG_INVITE_BILINGUAL } = process.env

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
        }

        const mockedSendOrgInviteEmail = sendOrgInviteEmail({
          notifyClient,
          i18n,
        })
        await mockedSendOrgInviteEmail({
          user,
          orgNameEN: 'Test Org EN',
          orgNameFR: 'Test Org FR',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_ORG_INVITE_BILINGUAL, user.userName, {
          personalisation: {
            display_name: user.displayName,
            organization_name_en: 'Test Org EN',
            organization_name_fr: 'Test Org FR',
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
          const mockedSendOrgInviteEmail = sendOrgInviteEmail({
            notifyClient,
            i18n,
          })
          await mockedSendOrgInviteEmail({
            user,
            orgNameEN: 'Test Org EN',
            orgNameFR: 'Test Org FR',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Unable to send org invite email. Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending org invite email for ${user._key}: Error: Notification error occurred.`,
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

        const mockedSendOrgInviteEmail = sendOrgInviteEmail({
          notifyClient,
          i18n,
        })
        await mockedSendOrgInviteEmail({
          user,
          orgNameEN: 'Test Org EN',
          orgNameFR: 'Test Org FR',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(NOTIFICATION_ORG_INVITE_BILINGUAL, user.userName, {
          personalisation: {
            display_name: user.displayName,
            organization_name_en: 'Test Org EN',
            organization_name_fr: 'Test Org FR',
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
          const mockedSendOrgInviteEmail = sendOrgInviteEmail({
            notifyClient,
            i18n,
          })
          await mockedSendOrgInviteEmail({
            user,
            orgNameEN: 'Test Org EN',
            orgNameFR: 'Test Org FR',
          })
        } catch (err) {
          expect(err).toEqual(new Error("Impossible d'envoyer l'e-mail d'invitation à l'org. Veuillez réessayer."))
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending org invite email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
