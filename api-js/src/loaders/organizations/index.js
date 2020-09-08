const { orgLoaderById } = require('./load-organization-by-id')
const { orgLoaderBySlug } = require('./load-organization-by-slug')
const { orgLoaderByConnectionArgs } = require('./load-organizations-connection-args')
const { orgLoaderConnectionArgsByDomainId } = require('./load-organization-connections-by-domain-id')

module.exports = {
  orgLoaderById,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  orgLoaderConnectionArgsByDomainId,
}
