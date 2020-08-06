const { notifyClient } = require('./notify-client')

const sendAuthEmail = async ({ user }) => {
  const templateId = 'a517d99f-ddb2-4494-87e1-d5ae6ca53090'
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        user: user.displayName,
        tfa_code: user.tfaCode,
      },
    })
  } catch (err) {
    console.error(
      `Error ocurred when sending authentication code via email for ${user._key}: ${err}`,
    )
    throw new Error('Unable to authenticate. Please try again.')
  }
}

module.exports = {
  sendAuthEmail,
}
