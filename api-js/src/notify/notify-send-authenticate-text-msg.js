const { t } = require('@lingui/macro')
const { notifyClient: defaultClient } = require('./notify-client')

const sendAuthTextMsg = (i18n) => async ({
  user,
  notifyClient = defaultClient,
}) => {
  const templateId = 'bccda53c-278f-4d8c-a8d1-7b58cade2bd8'

  try {
    await notifyClient.sendSms(templateId, user.phoneNumber, {
      personalisation: {
        tfa_code: user.tfaCode,
      },
    })
    return true
  } catch (err) {
    console.error(
      `Error ocurred when sending authentication code via text for ${user._key}: ${err}`,
    )
    throw new Error(i18n._(t`Unable to authenticate. Please try again.`))
  }
}

module.exports = {
  sendAuthTextMsg,
}
