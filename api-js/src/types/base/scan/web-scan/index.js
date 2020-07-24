const { GraphQLObjectType } = require('graphql')
const { globalIdField, connectionDefinitions } = require('graphql-relay')
const { Url, DateTime } = require('../../../../scalars')
const { nodeInterface } = require('../../../node')
const { httpsType } = require('./https')
const { sslType } = require('./ssl')

const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    id: globalIdField('web-scan'),
    domain: {
      type: Url,
      description: 'The domain the scan was ran on.',
    },
    timestamp: {
      type: DateTime,
      description: 'The time the scan was initiated.',
    },
    https: {
      type: httpsType,
      description: 'Hyper Text Transfer Protocol Secure scan results.',
    },
    ssl: {
      type: sslType,
      description: 'Secure Socket Layer scan results.',
    },
  }),
  interfaces: [nodeInterface],
  description: 'Results of HTTPS, and SSL scan on the given domain.',
})

const webScanConnection = connectionDefinitions({
  name: 'WebScan',
  nodeType: webScanType,
})

module.exports = {
  webScanType,
  webScanConnection,
}
