import { t } from '@lingui/macro'

const { NOTIFICATION_PASSWORD_RESET_EN, NOTIFICATION_PASSWORD_RESET_FR } =
  process.env

export const sendPasswordResetEmail =
  ({ notifyClient, i18n }) =>
  async ({ user, resetUrl }) => {
    let templateId = NOTIFICATION_PASSWORD_RESET_EN
    if (user.preferredLang === 'french') {
      templateId = NOTIFICATION_PASSWORD_RESET_FR
    }

    try {
      await notifyClient.sendEmail(templateId, user.userName, {
        personalisation: {
          user: user.displayName,
          password_reset_url: resetUrl,
        },
      })
      return true
    } catch (err) {
      console.error(
        `Error ocurred when sending password reset email for ${user._key}: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to send password reset email. Please try again.`),
      )
    }
  }
