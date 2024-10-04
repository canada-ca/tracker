const { NOTIFICATION_PENDING_USERS } = process.env

const sendPendingOrgUsersEmail = async ({ notifyClient, user, orgNames }) => {
  const templateId = NOTIFICATION_PENDING_USERS

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name_en: orgNames.en,
        organization_name_fr: orgNames.fr,
        admin_link: 'https://tracker.canada.ca/admin/organizations',
      },
    })
  } catch (err) {
    console.error(`Error occurred when sending pending users alert via email for ${user._key}: ${err}`)
  }
}

module.exports = {
  sendPendingOrgUsersEmail,
}
