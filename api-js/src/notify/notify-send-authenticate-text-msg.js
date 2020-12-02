const { CIPHER_KEY } = process.env
const crypto = require('crypto')
const { t } = require('@lingui/macro')

const sendAuthTextMsg = (notifyClient, i18n) => async ({ user }) => {
  const templateId = 'bccda53c-278f-4d8c-a8d1-7b58cade2bd8'

  const { iv, tag, phoneNumber: encryptedData } = user.phoneDetails
  const decipher = crypto.createDecipheriv(
    'aes-256-ccm',
    String(CIPHER_KEY),
    Buffer.from(iv, 'hex'),
    { authTagLength: 16 },
  )
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  let phoneNumber = decipher.update(encryptedData, 'hex', 'utf8')
  phoneNumber += decipher.final('utf8')

  try {
    await notifyClient.sendSms(templateId, phoneNumber, {
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
