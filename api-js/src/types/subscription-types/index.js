const { dkimResultSubType } = require('./dkim-result-sub')
const { dkimSubType } = require('./dkim-sub')
const { dmarcSubType } = require('./dmarc-sub')
const { httpsSubType } = require('./https-sub')
const { spfSubType } = require('./spf-sub')
const { sslSubType } = require('./ssl-sub')

module.exports = {
  dkimResultSubType,
  dkimSubType,
  dmarcSubType,
  httpsSubType,
  spfSubType,
  sslSubType,
}
