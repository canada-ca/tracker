const { notifyClient: defaultClient } = require('./notify-client')

const sendTfaTextMsg = async ({
  templateId,
  phoneNumber,
  user,
  notifyClient = defaultClient,
}) => {
  try {
    await notifyClient.sendSms(templateId, phoneNumber, {
      personalisation: {
        verify_code: user.tfaCode,
      },
    })
    return true
  } catch (err) {
    console.error(
      `Error ocurred when sending two factor authentication message for ${user._key}: ${err}`,
    )
    throw new Error(
      'Unable to send two factor authentication message. Please try again.',
    )
  }
}

module.exports = {
  sendTfaTextMsg,
}
