const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')
const { globalIdField } = require('graphql-relay')
const { GraphQLDateTime } = require('graphql-scalars')
const { nodeInterface } = require('../../../node')
const { Domain } = require('../../../../scalars')

const dkimType = new GraphQLObjectType({
  name: 'DKIM',
  fields: () => ({
    id: globalIdField('dkim'),
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
    record: {
      type: GraphQLString,
      description: `DKIM record retrieved during the scan of the domain.`,
      resolve: async () => {},
    },
    keyLength: {
      type: GraphQLString,
      description: `Length of DKIM public key.`,
      resolve: async () => {},
    },
    dkimGuidanceTags: {
      type: GraphQLList(GraphQLString),
      description: `Key tags found during scan.`,
      resolve: async () => {},
    },
  }),
  interfaces: [nodeInterface],
  description: `DomainKeys Identified Mail (DKIM) permits a person, role, or
    organization that owns the signing domain to claim some
    responsibility for a message by associating the domain with the
    message.  This can be an author's organization, an operational relay,
    or one of their agents.`,
})

module.exports = {
  dkimType,
}
