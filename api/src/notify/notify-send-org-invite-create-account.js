import { t } from '@lingui/macro'

const { NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_BILINGUAL } = process.env

export const sendOrgInviteCreateAccount =
  ({ notifyClient, i18n }) =>
  async ({ user, orgNameEN, orgNameFR, createAccountLink }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_BILINGUAL, user.userName, {
        personalisation: {
          create_account_link: createAccountLink,
          display_name: user.userName,
          organization_name_en: orgNameEN,
          organization_name_fr: orgNameFR,
        },
      })
    } catch (err) {
      console.error(`Error occurred when sending org create account invite email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send org invite email. Please try again.`))
    }
  }
