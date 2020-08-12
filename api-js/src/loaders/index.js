const { domainLoaderById, domainLoaderBySlug } = require('./domains')
const {
  orgLoaderByDomainId,
  orgLoaderById,
  orgLoaderBySlug,
} = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Domain Loaders
  domainLoaderById,
  domainLoaderBySlug,
  // Org Loaders
  orgLoaderByDomainId,
  orgLoaderById,
  orgLoaderBySlug,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
