const { GraphQLObjectType } = require('graphql')

const { dkimScanData } = require('./dkim-scan-data')
const { dmarcScanData } = require('./dmarc-scan-data')
const { httpsScanData } = require('./https-scan-data')
const { spfScanData } = require('./spf-scan-data')
const { sslScanData } = require('./ssl-scan-data')

const createSubscriptionSchema = () => {
  return new GraphQLObjectType({
    name: 'Subscription',
    fields: () => ({
      dkimScanData,
      dmarcScanData,
      httpsScanData,
      spfScanData,
      sslScanData,
    }),
  })
}

module.exports = {
  createSubscriptionSchema,
}
