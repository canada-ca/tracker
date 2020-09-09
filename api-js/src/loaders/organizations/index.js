const { orgLoaderByKey } = require('./load-organization-by-key')
const { orgLoaderBySlug } = require('./load-organization-by-slug')
const { orgLoaderByConnectionArgs } = require('./load-organizations-connection-args')
const { orgLoaderConnectionArgsByDomainId } = require('./load-organization-connections-by-domain-id')

module.exports = {
  orgLoaderByKey,
  orgLoaderBySlug,
  orgLoaderByConnectionArgs,
  orgLoaderConnectionArgsByDomainId,
}
