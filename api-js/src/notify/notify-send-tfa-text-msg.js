import { t } from '@lingui/macro'

const {
  NOTIFICATION_TWO_FACTOR_CODE_EN,
  NOTIFICATION_TWO_FACTOR_CODE_FR,
} = process.env

export const sendTfaTextMsg = ({ notifyClient, i18n }) => async ({
  phoneNumber,
  user,
}) => {
  let templateId = NOTIFICATION_TWO_FACTOR_CODE_EN
  if (user.preferredLang === 'french') {
    templateId = NOTIFICATION_TWO_FACTOR_CODE_FR
  }

  try {
    await notifyClient.sendSms(templateId, phoneNumber, {
      personalisation: {
        verify_code: user.tfaCode,
      },
    })
    return true
  } catch (err) {
    console.error(
      `Error occurred when sending two factor authentication message for ${user._key}: ${err}`,
    )
    throw new Error(
      i18n._(
        t`Unable to send two factor authentication message. Please try again.`,
      ),
    )
  }
}
