const { GraphQLObjectType } = require('graphql')
const { globalIdField, connectionDefinitions, connectionArgs } = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { httpsConnection } = require('./https')
const { sslConnection } = require('./ssl')
const { Domain } = require('../../../../scalars')

const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    id: globalIdField('web-scan'),
    domain: {
      type: Domain,
      description: `The domain the scan was ran on.`,
      resolve: async () => {},
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time the scan was initiated.`,
      resolve: async () => {},
    },
    https: {
      type: httpsConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Hyper Text Transfer Protocol Secure scan results.`,
      resolve: async () => {},
    },
    ssl: {
      type: sslConnection.connectionType,
      args: {
        ...connectionArgs,
      },
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
