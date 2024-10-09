import { t } from '@lingui/macro'

const { NOTIFICATION_USERNAME_UPDATED_BILINGUAL } = process.env

export const sendUpdatedUserNameEmail =
  ({ notifyClient, i18n }) =>
  async ({ previousUserName, newUserName, displayName, userKey }) => {
    try {
      await notifyClient.sendEmail(NOTIFICATION_USERNAME_UPDATED_BILINGUAL, previousUserName, {
        personalisation: {
          user: displayName,
          new_username: newUserName,
        },
      })
      return true
    } catch (err) {
      console.error(`Error occurred when sending updated username email for ${userKey}: ${err}`)
      throw new Error(i18n._(t`Unable to send updated username email. Please try again.`))
    }
  }
