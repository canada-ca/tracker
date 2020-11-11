const { t } = require('@lingui/macro')

const sendTfaTextMsg = (notifyClient, i18n) => async ({
  templateId,
  phoneNumber,
  user,
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
      i18n._(
        t`Unable to send two factor authentication message. Please try again.`,
      ),
    )
  }
}

module.exports = {
  sendTfaTextMsg,
}
