const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')
const { globalIdField, connectionDefinitions } = require('graphql-relay')
const { GraphQLDate } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { Domain } = require('../../../../scalars')

const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    id: globalIdField('dkim'),
    domain: {
      type: Domain,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domain }) => domain,
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: async ({ timestamp }) => timestamp,
    },
    record: {
      type: GraphQLString,
      description: `DKIM record retrieved during the scan of the domain.`,
      resolve: async ({ record }) => record,
    },
    keyLength: {
      type: GraphQLString,
      description: `Length of DKIM public key.`,
      resolve: async ({ keyLength }) => keyLength,
    },
    dkimGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async ({ dkimGuidanceTags }) => dkimGuidanceTags,
    },
  }),
  interfaces: [nodeInterface],
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
    organization that owns the signing domain to claim some
    responsibility for a message by associating the domain with the
    message.  This can be an author's organization, an operational relay,
    or one of their agents.`,
})

const dkimConnection = connectionDefinitions({
  name: 'DKIM',
  nodeType: dkimType,
})

module.exports = {
  dkimType,
  dkimConnection,
}
