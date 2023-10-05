const { NOTIFICATION_ORG_FOOTPRINT_BILINGUAL } = process.env

const sendOrgFootprintEmail = async ({ notifyClient, user, auditLogs, orgNames }) => {
  const templateId = NOTIFICATION_ORG_FOOTPRINT_BILINGUAL

  // Get stats for user changes
  const usersAdded = auditLogs.filter((log) => log.action === 'add' && log.target.resourceType === 'user')
  const usersUpdated = auditLogs.filter((log) => log.action === 'update' && log.target.resourceType === 'user')
  const usersRemoved = auditLogs.filter((log) => log.action === 'remove' && log.target.resourceType === 'user')

  // Get stats for domain changes
  const domainsAdded = auditLogs.filter((log) => log.action === 'add' && log.target.resourceType === 'domain')
  const domainsUpdated = auditLogs.filter((log) => log.action === 'update' && log.target.resourceType === 'domain')
  const domainsRemoved = auditLogs.filter((log) => log.action === 'remove' && log.target.resourceType === 'domain')

  let addDomainsList = ''
  let updateDomainsList = ''
  let removeDomainsList = ''

  // Get list of domains added
  if (domainsAdded.length > 0) {
    addDomainsList = domainsAdded.map((log) => log.target.resource).join(', ')
  }
  // Get list of domains updated
  if (domainsUpdated.length > 0) {
    updateDomainsList = domainsUpdated.map((log) => log.target.resource).join(', ')
  }
  // Get list of domains removed
  if (domainsRemoved.length > 0) {
    removeDomainsList = domainsRemoved.map((log) => log.target.resource).join(', ')
  }

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        organization_name_en: orgNames.en,
        organization_name_fr: orgNames.fr,
        add_users_count: usersAdded.length,
        update_users_count: usersUpdated.length,
        remove_users_count: usersRemoved.length,
        add_domains_count: domainsAdded.length,
        add_domains_list: addDomainsList,
        update_domains_count: domainsUpdated.length,
        update_domains_list: updateDomainsList,
        remove_domains_count: domainsRemoved.length,
        remove_domains_list: removeDomainsList,
      },
    })
  } catch (err) {
    console.error(`Error occurred when sending org footprint changes via email for ${user._key}: ${err}`)
  }
}

module.exports = {
  sendOrgFootprintEmail,
}
