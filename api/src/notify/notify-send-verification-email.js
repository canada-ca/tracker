import {t} from '@lingui/macro'

const {
  NOTIFICATION_VERIFICATION_EMAIL_EN,
  NOTIFICATION_VERIFICATION_EMAIL_FR,
} = process.env

export const sendVerificationEmail = ({notifyClient, i18n}) => async ({
                                                                        user,
                                                                        verifyUrl,
                                                                      }) => {
  let templateId = NOTIFICATION_VERIFICATION_EMAIL_EN
  if (user.preferredLang === 'french') {
    templateId = NOTIFICATION_VERIFICATION_EMAIL_FR
  }

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
      `Error occurred when sending verification email for ${user._key}: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to send verification email. Please try again.`),
    )
  }
}
