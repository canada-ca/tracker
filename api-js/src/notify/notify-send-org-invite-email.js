import { t } from '@lingui/macro'

export const sendOrgInviteEmail = (notifyClient, i18n) => async ({
  templateId,
  user,
  orgName,
}) => {
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name: orgName,
      },
    })
  } catch (err) {
    console.error(
      `Error ocurred when sending org invite email for ${user._key}: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to send org invite email. Please try again.`),
    )
  }
}
