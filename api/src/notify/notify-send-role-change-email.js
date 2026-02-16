import { t } from '@lingui/macro'

const { NOTIFICATION_ROLE_CHANGE_EMAIL } = process.env

export const sendRoleChangeEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, orgNames, oldRole, newRole }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_ROLE_CHANGE_EMAIL, user.userName, {
        personalisation: {
          display_name: user.displayName,
          org_name_en: orgNames.orgNameEN,
          org_name_fr: orgNames.orgNameFR,
          old_role: oldRole,
          new_role: newRole,
        },
      })
      return true
    } catch (err) {
      console.error(`Error occurred when sending role update email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send role update email. Please try again.`))
    }
  }
