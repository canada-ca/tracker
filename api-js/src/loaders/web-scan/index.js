const { httpsLoaderByKey } = require('./load-https-by-key')
const { httpsLoaderConnectionsByDomainId } = require('./load-https-connections-by-domain-id')
const { sslLoaderByKey} = require('./load-ssl-by-key')
const { sslLoaderConnectionsByDomainId } = require('./load-ssl-connections-by-domain-id')

module.exports = {
  httpsLoaderByKey,
  httpsLoaderConnectionsByDomainId,
  sslLoaderByKey,
  sslLoaderConnectionsByDomainId,
}