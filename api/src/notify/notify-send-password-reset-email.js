import { t } from '@lingui/macro'

const { NOTIFICATION_PASSWORD_RESET_BILINGUAL } = process.env

export const sendPasswordResetEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, resetUrl }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_PASSWORD_RESET_BILINGUAL, user.userName, {
        personalisation: {
          user: user.displayName,
          password_reset_url: resetUrl,
        },
      })
      return true
    } catch (err) {
      console.error(`Error occurred when sending password reset email for ${user._key}: ${err}`)
      throw new Error(i18n._(t`Unable to send password reset email. Please try again.`))
    }
  }
