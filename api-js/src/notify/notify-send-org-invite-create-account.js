const { t } = require('@lingui/macro')
const { notifyClient: defaultClient } = require('./notify-client')

const sendOrgInviteCreateAccount = (i18n) => async ({
  templateId,
  user,
  orgName,
  createAccountLink,
  notifyClient = defaultClient,
}) => {
  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        create_account_link: createAccountLink,
        display_name: user.userName,
        organization_name: orgName,
      },
    })
  } catch (err) {
    console.error(
      `Error ocurred when sending org create account invite email for ${user._key}: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to send org invite email. Please try again.`),
    )
  }
}

module.exports = {
  sendOrgInviteCreateAccount,
}
