const { notifyClient: defaultClient } = require('./notify-client')

const sendVerificationEmail = async ({
  templateId,
  user,
  verifyUrl,
  notifyClient = defaultClient,
}) => {
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        user: user.displayName,
        verify_email_url: verifyUrl,
      },
    })
    return true
  } catch (err) {
    console.error(
      `Error ocurred when sending verification email for ${user._key}: ${err}`,
    )
    throw new Error('Unable to send verification email. Please try again.')
  }
}

module.exports = {
  sendVerificationEmail,
}
