const { domainLoaderById, domainLoaderBySlug } = require('./domains')
const { orgLoaderById, orgLoaderBySlug, loadOrganizationsConnections } = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Domain Loaders
  domainLoaderById,
  domainLoaderBySlug,
  // Org Loaders
  orgLoaderById,
  orgLoaderBySlug,
  loadOrganizationsConnections,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
