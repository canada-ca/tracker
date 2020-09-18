const { domainLoaderDmarcReport } = require('./load-dmarc-report')
const { domainLoaderByKey } = require('./load-domain-by-key')
const { domainLoaderByDomain } = require('./load-domain-by-domain')
const {
  domainLoaderConnectionsByOrgId,
} = require('./load-domain-connections-by-organizations-id')

module.exports = {
  domainLoaderDmarcReport,
  domainLoaderByKey,
  domainLoaderByDomain,
  domainLoaderConnectionsByOrgId,
}
