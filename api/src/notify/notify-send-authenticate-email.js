import {t} from '@lingui/macro'

const {NOTIFICATION_AUTHENTICATE_EMAIL_ID} = process.env

export const sendAuthEmail = ({notifyClient, i18n}) => async ({user}) => {
  const templateId = NOTIFICATION_AUTHENTICATE_EMAIL_ID
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        user: user.displayName,
        tfa_code: user.tfaCode,
      },
    })
  } catch (err) {
    console.error(
      `Error occurred when sending authentication code via email for ${user._key}: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to send authentication email. Please try again.`),
    )
  }
}
