import { setupI18n } from '@lingui/core'

import englishMessages from '../../locale/en/messages'
import frenchMessages from '../../locale/fr/messages'
import { sendOrgInviteCreateAccount } from '../index'

const { NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_BILINGUAL } = process.env

describe('given the sendOrgInviteCreateAccount function', () => {
  let i18n
  let consoleOutput = []
  const mockedError = (output) => consoleOutput.push(output)

  beforeAll(async () => {
    console.error = mockedError
  })

  beforeEach(async () => {
    consoleOutput = []
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

        const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount({
          notifyClient,
          i18n,
        })
        await mockedSendOrgInviteCreateAccount({
          user,
          orgNameEN: 'Test Org EN',
          orgNameFR: 'Test Org FR',
          createAccountLink: 'TestLink.ca',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(
          NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_BILINGUAL,
          user.userName,
          {
            personalisation: {
              create_account_link: 'TestLink.ca',
              display_name: user.userName,
              organization_name_en: 'Test Org EN',
              organization_name_fr: 'Test Org FR',
            },
          },
        )
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
          const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount({
            notifyClient,
            i18n,
          })
          await mockedSendOrgInviteCreateAccount({
            user,
            orgName: 'Test Org',
            createAccountLink: 'TestLink.ca',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Unable to send org invite email. Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending org create account invite email for ${user._key}: Error: Notification error occurred.`,
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

        const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount({
          notifyClient,
          i18n,
        })
        await mockedSendOrgInviteCreateAccount({
          user,
          orgNameEN: 'Test Org EN',
          orgNameFR: 'Test Org FR',
          createAccountLink: 'TestLink.ca',
        })

        expect(notifyClient.sendEmail).toHaveBeenCalledWith(
          NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_BILINGUAL,
          user.userName,
          {
            personalisation: {
              create_account_link: 'TestLink.ca',
              display_name: user.userName,
              organization_name_en: 'Test Org EN',
              organization_name_fr: 'Test Org FR',
            },
          },
        )
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
          const mockedSendOrgInviteCreateAccount = sendOrgInviteCreateAccount({
            notifyClient,
            i18n,
          })
          await mockedSendOrgInviteCreateAccount({
            user,
            orgName: 'Test Org',
            createAccountLink: 'TestLink.ca',
          })
        } catch (err) {
          expect(err).toEqual(new Error('Unable to send org invite email. Please try again.'))
        }

        expect(consoleOutput).toEqual([
          `Error occurred when sending org create account invite email for ${user._key}: Error: Notification error occurred.`,
        ])
      })
    })
  })
})
