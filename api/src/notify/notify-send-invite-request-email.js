import { t } from '@lingui/macro'

const { NOTIFICATION_ORG_INVITE_REQUEST_EN, NOTIFICATION_ORG_INVITE_REQUEST_FR } = process.env

export const sendInviteRequestEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, orgName, adminLink }) => {
    let templateId = NOTIFICATION_ORG_INVITE_REQUEST_EN
    if (user.preferredLang === 'french') {
      templateId = NOTIFICATION_ORG_INVITE_REQUEST_FR
    }

    try {
      await notifyClient.sendEmail(templateId, user.userName, {
        personalisation: {
          admin_link: adminLink,
          display_name: user.displayName,
          organization_name: orgName,
        },
      })
    } catch (err) {
      console.error(`Error occurred when sending org invite request email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send org invite request email. Please try again.`))
    }
  }
