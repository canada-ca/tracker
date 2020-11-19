const {
  verifiedOrgLoaderByKey,
} = require('./load-verified-organization-by-key')
const {
  verifiedOrgLoaderBySlug,
} = require('./load-verified-organization-by-slug')
const {
  verifiedOrgLoaderConnectionsByDomainId,
} = require('./load-verified-organization-connections-by-domain-id')
const {
  verifiedOrgLoaderConnections,
} = require('./load-verified-organizations-connections')

module.exports = {
  verifiedOrgLoaderByKey,
  verifiedOrgLoaderBySlug,
  verifiedOrgLoaderConnectionsByDomainId,
  verifiedOrgLoaderConnections,
}
