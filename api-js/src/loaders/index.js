const {
  orgLoaderByDomainId,
  orgLoaderById,
  orgLoaderBySlug,
} = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Org Loaders
  orgLoaderByDomainId,
  orgLoaderById,
  orgLoaderBySlug,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
