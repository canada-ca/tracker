const { notifyClient: defaultClient } = require('./notify-client')

const sendPasswordResetEmail = async ({
  templateId,
  user,
  resetUrl,
  notifyClient = defaultClient,
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
    throw new Error('Unable to send password reset email. Please try again.')
  }
}

module.exports = {
  sendPasswordResetEmail,
}
