const { dkimGuidanceTagLoader } = require('./load-dkim-guidance-tags')
const { dmarcGuidanceTagLoader } = require('./load-dmarc-guidance-tags')
const { httpsGuidanceTagLoader } = require('./load-https-guidance-tags')
const { spfGuidanceTagLoader } = require('./load-spf-guidance-tags')
const { sslGuidanceTagLoader } = require('./load-ssl-guidance-tags')

module.exports = {
  dkimGuidanceTagLoader,
  dmarcGuidanceTagLoader,
  httpsGuidanceTagLoader,
  spfGuidanceTagLoader,
  sslGuidanceTagLoader,
}
