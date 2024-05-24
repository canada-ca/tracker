import { t } from '@lingui/macro'

const { NOTIFICATION_ORG_INVITE_BILINGUAL } = process.env

export const sendOrgInviteEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, orgNameEN, orgNameFR }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_ORG_INVITE_BILINGUAL, user.userName, {
        personalisation: {
          display_name: user.displayName,
          organization_name_en: orgNameEN,
          organization_name_fr: orgNameFR,
        },
      })
    } catch (err) {
      console.error(`Error occurred when sending org invite email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send org invite email. Please try again.`))
    }
  }
