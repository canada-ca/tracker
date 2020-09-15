const { domainLoaderByKey } = require('./load-domain-by-key')
const { domainLoaderBySlug } = require('./load-domain-by-slug')
const {
  domainLoaderConnectionsByOrgId,
} = require('./load-domain-connections-by-organizations-id')

module.exports = {
  domainLoaderByKey,
  domainLoaderBySlug,
  domainLoaderConnectionsByOrgId,
}
