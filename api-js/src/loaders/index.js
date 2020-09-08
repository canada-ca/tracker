const { domainLoaderById, domainLoaderBySlug } = require('./domains')
const { orgLoaderById, orgLoaderBySlug, orgLoaderByConnectionArgs, orgLoaderConnectionArgsByDomainId } = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Domain Loaders
  domainLoaderById,
  domainLoaderBySlug,
  // Org Loaders
  orgLoaderById,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  orgLoaderConnectionArgsByDomainId,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
