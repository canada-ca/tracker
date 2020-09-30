const domainLoaders = require('./domains')
const orgLoaders = require('./organizations')
const userLoaders = require('./user')

module.exports = {
  // Domain Loaders
  ...domainLoaders,
  // Org Loaders
  ...orgLoaders,
  // User Loaders
  ...userLoaders,
}
