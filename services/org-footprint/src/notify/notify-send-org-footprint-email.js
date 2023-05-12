const { NOTIFICATION_ORG_FOOTPRINT_EN, NOTIFICATION_ORG_FOOTPRINT_FR } = process.env

const sendOrgFootprintEmail = async ({ notifyClient, user, auditLogs, orgNames }) => {
  let templateId = NOTIFICATION_ORG_FOOTPRINT_EN
  if (user.preferredLang === 'french') {
    templateId = NOTIFICATION_ORG_FOOTPRINT_FR
  }

  // Get stats for user changes
  const usersAdded = auditLogs.filter((log) => log.action === 'add' && log.target.resourceType === 'user')
  const usersUpdated = auditLogs.filter((log) => log.action === 'update' && log.target.resourceType === 'user')
  const usersRemoved = auditLogs.filter((log) => log.action === 'remove' && log.target.resourceType === 'user')

  // Get stats for domain changes
  const domainsAdded = auditLogs.filter((log) => log.action === 'add' && log.target.resourceType === 'domain')
  const domainsUpdated = auditLogs.filter((log) => log.action === 'update' && log.target.resourceType === 'domain')
  const domainsRemoved = auditLogs.filter((log) => log.action === 'remove' && log.target.resourceType === 'domain')

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name: user.preferredLang === 'french' ? orgNames.fr : orgNames.en,
        add_users_count: usersAdded.length,
        update_users_count: usersUpdated.length,
        remove_users_count: usersRemoved.length,
        add_domains_count: domainsAdded.length,
        update_domains_count: domainsUpdated.length,
        remove_domains_count: domainsRemoved.length,
      },
    })
  } catch (err) {
    console.error(`Error occurred when sending org footprint changes via email for ${user._key}: ${err}`)
  }
}

module.exports = {
  sendOrgFootprintEmail,
}
