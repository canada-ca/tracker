const { domainLoaderByKey } = require('./load-domain-by-key')
const { domainLoaderByDomain } = require('./load-domain-by-domain')
const {
  domainLoaderConnectionsByOrgId,
} = require('./load-domain-connections-by-organizations-id')
const {
  domainLoaderConnectionsByUserId,
} = require('./load-domain-connections-by-user-id')

module.exports = {
  domainLoaderByKey,
  domainLoaderByDomain,
  domainLoaderConnectionsByOrgId,
  domainLoaderConnectionsByUserId,
}
