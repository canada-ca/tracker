const { domainLoaderById, domainLoaderBySlug } = require('./domains')
const { orgLoaderById, orgLoaderBySlug } = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Domain Loaders
  domainLoaderById,
  domainLoaderBySlug,
  // Org Loaders
  orgLoaderById,
  orgLoaderBySlug,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
