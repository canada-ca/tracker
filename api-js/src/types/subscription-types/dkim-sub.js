const { GraphQLObjectType, GraphQLList } = require('graphql')
const { dkimResultSubType } = require('./dkim-result-sub')

const dkimSubType = new GraphQLObjectType({
  name: 'DkimSub',
  description: '',
  fields: () => ({
    results: {
      type: GraphQLList(dkimResultSubType),
      description: 'Individual scans results for each dkim selector.',
      resolve: ({ results }) => results,
    },
  }),
})

module.exports = {
  dkimSubType,
}
