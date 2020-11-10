const { dkimGuidanceTagLoader } = require('./load-dkim-guidance-tags')
const {
  dkimGuidanceTagConnectionsLoader,
} = require('./load-dkim-guidance-tags-connections')
const { dmarcGuidanceTagLoader } = require('./load-dmarc-guidance-tags')
const {
  dmarcGuidanceTagConnectionsLoader,
} = require('./load-dmarc-guidance-tags-connections')
const { httpsGuidanceTagLoader } = require('./load-https-guidance-tags')
const {
  httpsGuidanceTagConnectionsLoader,
} = require('./load-https-guidance-tags-connections')
const { spfGuidanceTagLoader } = require('./load-spf-guidance-tags')
const {
  spfGuidanceTagConnectionsLoader,
} = require('./load-spf-guidance-tags-connections')
const { sslGuidanceTagLoader } = require('./load-ssl-guidance-tags')
const {
  sslGuidanceTagConnectionsLoader,
} = require('./load-ssl-guidance-tags-connections')

module.exports = {
  dkimGuidanceTagLoader,
  dkimGuidanceTagConnectionsLoader,
  dmarcGuidanceTagLoader,
  dmarcGuidanceTagConnectionsLoader,
  httpsGuidanceTagLoader,
  httpsGuidanceTagConnectionsLoader,
  spfGuidanceTagLoader,
  spfGuidanceTagConnectionsLoader,
  sslGuidanceTagLoader,
  sslGuidanceTagConnectionsLoader,
}
