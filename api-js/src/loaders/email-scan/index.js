const { dkimLoaderByKey } = require('./load-dkim-by-key')
const {
  dkimLoaderConnectionsByDomainId,
} = require('./load-dkim-connections-by-domain-id')
const { dkimResultLoaderByKey } = require('./load-dkim-result-by-key')
const {
  dkimResultsLoaderConnectionByDkimId,
} = require('./load-dkim-results-connections-by-dkim-id')
const { dmarcLoaderByKey } = require('./load-dmarc-by-key')
const {
  dmarcLoaderConnectionsByDomainId,
} = require('./load-dmarc-connections-by-domain-id')
const { spfLoaderByKey } = require('./load-spf-by-key')
const {
  spfLoaderConnectionsByDomainId,
} = require('./load-spf-connections-by-domain-id')

module.exports = {
  dkimLoaderByKey,
  dkimResultLoaderByKey,
  dmarcLoaderByKey,
  spfLoaderByKey,
  dkimLoaderConnectionsByDomainId,
  dkimResultsLoaderConnectionByDkimId,
  dmarcLoaderConnectionsByDomainId,
  spfLoaderConnectionsByDomainId,
}
