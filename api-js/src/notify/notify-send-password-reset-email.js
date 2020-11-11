const { t } = require('@lingui/macro')

const sendPasswordResetEmail = (notifyClient, i18n) => async ({
  templateId,
  user,
  resetUrl,
}) => {
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

module.exports = {
  sendPasswordResetEmail,
}
