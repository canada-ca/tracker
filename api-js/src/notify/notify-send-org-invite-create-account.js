import { t } from '@lingui/macro'

const {
  NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_EN,
  NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_FR,
} = process.env

export const sendOrgInviteCreateAccount =
  ({ notifyClient, i18n }) =>
  async ({ user, orgName, createAccountLink }) => {
    let templateId = NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_EN
    if (user.preferredLang === 'french') {
      templateId = NOTIFICATION_ORG_INVITE_CREATE_ACCOUNT_FR
    }

    try {
      await notifyClient.sendEmail(templateId, user.userName, {
        personalisation: {
          create_account_link: createAccountLink,
          display_name: user.userName,
          organization_name: orgName,
        },
      })
    } catch (err) {
      console.error(
        `Error ocurred when sending org create account invite email for ${user._key}: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to send org invite email. Please try again.`),
      )
    }
  }
