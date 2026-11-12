function buildOrgFootprintPayload({ logs, orgNames }) {
  const assetChangeLogs = filterAssetChangeLogs(logs)
  if (assetChangeLogs.length === 0) return null
  // Get stats for user changes
  const usersAdded = select(assetChangeLogs, 'add', 'user')
  const usersUpdated = select(assetChangeLogs, 'update', 'user')
  const usersRemoved = select(assetChangeLogs, 'remove', 'user')

  // Get stats for domain changes
  const domainsAdded = select(assetChangeLogs, 'add', 'domain')
  const domainsUpdated = select(assetChangeLogs, 'update', 'domain')
  const domainsRemoved = select(assetChangeLogs, 'remove', 'domain')

  const addDomainsList = joinResources(domainsAdded)
  const updateDomainsList = joinResources(domainsUpdated)
  const removeDomainsList = joinResources(domainsRemoved)

  return {
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
  }
}

function filterAssetChangeLogs(logs) {
  return logs.filter((log) => !['scan', 'export'].includes(log.action))
}

const select = (logs, action, resourceType) =>
  logs.filter((log) => log.action === action && log.target.resourceType === resourceType)

const joinResources = (logs) => logs.map((log) => log.target.resource).join(', ')

function addServiceAccountToRecipients({ users, redirect, serviceAccount }) {
  if (!redirect) {
    return users
  }
  return [
    ...users,
    {
      userName: serviceAccount,
      displayName: 'Service Account',
      _key: 'service-account',
    },
  ]
}

module.exports = {
  buildOrgFootprintPayload,
  addServiceAccountToRecipients,
}
