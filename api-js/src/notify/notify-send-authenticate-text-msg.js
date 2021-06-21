import crypto from 'crypto'
import { t } from '@lingui/macro'

const { CIPHER_KEY, NOTIFICATION_AUTHENTICATE_TEXT_ID } = process.env

export const sendAuthTextMsg =
  ({ notifyClient, i18n }) =>
  async ({ user }) => {
    const templateId = NOTIFICATION_AUTHENTICATE_TEXT_ID

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
      throw new Error(
        i18n._(
          t`Unable to send authentication text message. Please try again.`,
        ),
      )
    }
  }
