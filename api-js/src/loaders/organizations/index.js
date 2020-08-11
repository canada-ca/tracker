const { orgLoaderByDomainId } = require('./load-organization-by-domain-id')
const { orgLoaderById } = require('./load-organization-by-id')
const { orgLoaderBySlug } = require('./load-organization-by-slug')

module.exports = {
  orgLoaderByDomainId,
  orgLoaderById,
  orgLoaderBySlug,
}
