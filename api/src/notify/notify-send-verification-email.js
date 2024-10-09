import { t } from '@lingui/macro'

const { NOTIFICATION_VERIFICATION_EMAIL_BILINGUAL } = process.env

export const sendVerificationEmail =
  ({ notifyClient, i18n }) =>
  async ({ userName, displayName, verifyUrl, userKey }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_VERIFICATION_EMAIL_BILINGUAL, userName, {
        personalisation: {
          user: displayName,
          verify_email_url: verifyUrl,
        },
      })
      return true
    } catch (err) {
      console.error(`Error occurred when sending verification email for ${userKey}: ${err}`)
      throw new Error(i18n._(t`Unable to send verification email. Please try again.`))
    }
  }
