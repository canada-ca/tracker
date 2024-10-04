import { t } from '@lingui/macro'

const { NOTIFICATION_ORG_INVITE_REQUEST_BILINGUAL } = process.env

export const sendInviteRequestEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, orgNameEN, orgNameFR, adminLink }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_ORG_INVITE_REQUEST_BILINGUAL, user.userName, {
        personalisation: {
          admin_link: adminLink,
          display_name: user.displayName,
          organization_name_en: orgNameEN,
          organization_name_fr: orgNameFR,
        },
      })
    } catch (err) {
      console.error(`Error occurred when sending org invite request email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send org invite request email. Please try again.`))
    }
  }
