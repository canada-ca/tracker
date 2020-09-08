const { domainLoaderById, domainLoaderBySlug } = require('./domains')
const { orgLoaderById, orgLoaderBySlug, orgLoaderByConnectionArgs } = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Domain Loaders
  domainLoaderById,
  domainLoaderBySlug,
  // Org Loaders
  orgLoaderById,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
