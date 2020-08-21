const { orgLoaderById } = require('./load-organization-by-id')
const { orgLoaderBySlug } = require('./load-organization-by-slug')
const { loadOrganizationsConnections } = require('./load-organizations-connection')

module.exports = {
  orgLoaderById,
  orgLoaderBySlug,
  loadOrganizationsConnections,
}
