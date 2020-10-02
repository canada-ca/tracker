const { GraphQLObjectType, GraphQLList, GraphQLString } = require('graphql')
const { globalIdField, connectionDefinitions } = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { Domain } = require('../../../../scalars')

const sslType = new GraphQLObjectType({
  name: 'SSL',
  fields: () => ({
    id: globalIdField('ssl'),
    domain: {
      type: Domain,
      description: `The domain the scan was ran on.`,
      resolve: async () => {},
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: async () => {},
    },
    sslGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `Secure Socket Layer scan results.`,
})

const sslConnection = connectionDefinitions({
  name: 'SSL',
  nodeType: sslType,
})

module.exports = {
sslType,
sslConnection,
}
