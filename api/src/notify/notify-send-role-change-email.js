import { t } from '@lingui/macro'

const { NOTIFICATION_ROLE_CHANGE_EMAIL } = process.env

export const sendRoleChangeEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, orgNames, oldRole, newRole }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_ROLE_CHANGE_EMAIL, user.userName, {
        personalisation: {
          user: user.displayName,
          orgNameEN: orgNames.orgNameEN,
          orgNameFR: orgNames.orgNameFR,
          oldRole,
          newRole,
        },
      })
      return true
    } catch (err) {
      console.error(`Error occurred when sending role update email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send role update email. Please try again.`))
    }
  }
