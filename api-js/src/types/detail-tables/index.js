const { GraphQLObjectType, GraphQLList } = require('graphql')
const { tableStructureType } = require('./table-structure')

const detailTableType = new GraphQLObjectType({
  name: 'DetailTables',
  description: 'GraphQL object containing the details for each category.',
  fields: () => ({
    fullPass: {
      type: GraphQLList(tableStructureType),
      description: 'List of top senders that are passing all requirements.',
      resolve: async () => {},
    },
    spfFailure: {
      type: GraphQLList(tableStructureType),
      description: 'List of top senders that have spf failing.',
      resolve: async () => {},
    },
    spfMisaligned: {
      type: GraphQLList(tableStructureType),
      description: 'List of top senders that have spf misaligned.',
      resolve: async () => {},
    },
    dkimFailure: {
      type: GraphQLList(tableStructureType),
      description: 'List of top senders that have dkim failing.',
      resolve: async () => {},
    },
    dkimMisaligned: {
      type: GraphQLList(tableStructureType),
      description: 'List of top senders that have dkim misaligned.',
      resolve: async () => {},
    },
    dmarcFailure: {
      type: GraphQLList(tableStructureType),
      description: 'List of top senders that are failing dmarc.',
      resolve: async () => {},
    },
  }),
})

module.exports = {
  detailTableType,
}
