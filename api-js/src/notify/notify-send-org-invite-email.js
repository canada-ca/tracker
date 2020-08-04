const { notifyClient } = require('./notify-client')

const sendOrgInviteEmail = async ({ templateId, user, orgName }) => {
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name: orgName,
      },
    })
  } catch (err) {
    console.error(
      `Error ocurred when sending password org invite email for ${user._key}: ${err}`,
    )
    throw new Error('Unable to send org invite email. Please try again.')
  }
}

module.exports = {
  sendOrgInviteEmail,
}
