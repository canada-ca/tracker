const { GraphQLObjectType } = require('graphql')
const { globalIdField, connectionDefinitions } = require('graphql-relay')
const { GraphQLDateTime, GraphQLURL } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { httpsType } = require('./https')
const { sslType } = require('./ssl')

const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    id: globalIdField('web-scan'),
    domain: {
      type: GraphQLURL,
      description: `The domain the scan was ran on.`,
      resolve: async () => {},
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time the scan was initiated.`,
      resolve: async () => {},
    },
    https: {
      type: httpsType,
      description: `Hyper Text Transfer Protocol Secure scan results.`,
      resolve: async () => {},
    },
    ssl: {
      type: sslType,
      description: `Secure Socket Layer scan results.`,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `Results of HTTPS, and SSL scan on the given domain.`,
})

const webScanConnection = connectionDefinitions({
  name: 'WebScan',
  nodeType: webScanType,
})

module.exports = {
  webScanType,
  webScanConnection,
}
