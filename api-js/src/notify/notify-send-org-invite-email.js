const { t } = require('@lingui/macro')
const { notifyClient: defaultClient } = require('./notify-client')

const sendOrgInviteEmail = (i18n) => async ({
  templateId,
  user,
  orgName,
  notifyClient = defaultClient,
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

module.exports = {
  sendOrgInviteEmail,
}
