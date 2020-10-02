const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')
const { globalIdField } = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { Domain } = require('../../../../scalars')

const httpsType = new GraphQLObjectType({
  name: 'HTTPS',
  fields: () => ({
    id: globalIdField('https'),
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
    implementation: {
      type: GraphQLString,
      description: `State of the HTTPS implementation on the server and any issues therein.`,
      resolve: async () => {},
    },
    enforced: {
      type: GraphQLString,
      description: `Degree to which HTTPS is enforced on the server based on behaviour.`,
      resolve: async () => {},
    },
    hsts: {
      type: GraphQLString,
      description: `Presence and completeness of HSTS implementation.`,
      resolve: async () => {},
    },
    hstsAge: {
      type: GraphQLString,
      description: `Denotes how long the domain should only be accessed using HTTPS`,
      resolve: async () => {},
    },
    preloaded: {
      type: GraphQLString,
      description: `Denotes whether the domain has been submitted and included within HSTS preload list.`,
      resolve: async () => {},
    },
    httpsGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `Hyper Text Transfer Protocol Secure scan results.`,
})

module.exports = {
  httpsType,
}