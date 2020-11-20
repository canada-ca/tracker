const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')
const { guidanceTagType } = require('../base/guidance-tags')

const httpsSubType = new GraphQLObjectType({
  name: 'HttpsSub',
  description: '',
  fields: () => ({
    implementation: {
      type: GraphQLString,
      description: `State of the HTTPS implementation on the server and any issues therein.`,
      resolve: ({ implementation }) => implementation,
    },
    enforced: {
      type: GraphQLString,
      description: `Degree to which HTTPS is enforced on the server based on behaviour.`,
      resolve: ({ enforced }) => enforced,
    },
    hsts: {
      type: GraphQLString,
      description: `Presence and completeness of HSTS implementation.`,
      resolve: ({ hsts }) => hsts,
    },
    hstsAge: {
      type: GraphQLString,
      description: `Denotes how long the domain should only be accessed using HTTPS`,
      resolve: ({ hstsAge }) => hstsAge,
    },
    preloaded: {
      type: GraphQLString,
      description: `Denotes whether the domain has been submitted and included within HSTS preload list.`,
      resolve: ({ preloaded }) => preloaded,
    },
    guidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Key tags found during scan.`,
      resolve: async (
        { guidanceTags },
        _args,
        { loaders: { httpsGuidanceTagLoader } },
      ) => {
        const httpsTags = await httpsGuidanceTagLoader.loadMany(guidanceTags)
        return httpsTags
      },
    },
  }),
})

module.exports = {
  httpsSubType,
}
