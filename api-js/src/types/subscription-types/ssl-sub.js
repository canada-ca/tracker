const { GraphQLObjectType, GraphQLList } = require('graphql')
const { guidanceTagType } = require('../base/guidance-tags')

const sslSubType = new GraphQLObjectType({
  name: 'SslSub',
  description: '',
  fields: () => ({
    guidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Key tags found during DMARC Scan.`,
      resolve: async (
        { guidanceTags },
        _args,
        { loaders: { sslGuidanceTagLoader } },
      ) => {
        const sslTags = await sslGuidanceTagLoader.loadMany(guidanceTags)
        return sslTags
      },
    },
  }),
})

module.exports = {
  sslSubType,
}
