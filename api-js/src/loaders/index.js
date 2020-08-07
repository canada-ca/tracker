const { orgLoaderById, orgLoaderBySlug } = require('./organizations')
const { userLoaderByUserName, userLoaderById } = require('./user')

module.exports = {
  // Org Loaders
  orgLoaderById,
  orgLoaderBySlug,
  // User Loaders
  userLoaderByUserName,
  userLoaderById,
}
