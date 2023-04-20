import {t} from '@lingui/macro'

const {NOTIFICATION_ORG_INVITE_EN, NOTIFICATION_ORG_INVITE_FR} = process.env

export const sendOrgInviteEmail = ({notifyClient, i18n}) => async ({
                                                                     user,
                                                                     orgName,
                                                                   }) => {
  let templateId = NOTIFICATION_ORG_INVITE_EN
  if (user.preferredLang === 'french') {
    templateId = NOTIFICATION_ORG_INVITE_FR
  }

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name: orgName,
      },
    })
  } catch (err) {
    console.error(
      `Error occurred when sending org invite email for ${user._key}: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to send org invite email. Please try again.`),
    )
  }
}
