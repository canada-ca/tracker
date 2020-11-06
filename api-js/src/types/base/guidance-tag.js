const { GraphQLObjectType, GraphQLString } = require('graphql')

const guidanceTagType = new GraphQLObjectType({
  name: 'GuidanceTag',
  description:
    'Details for a given guidance tag based on https://github.com/canada-ca/tracker/wiki/Guidance-Tags',
  fields: () => ({
    tagId: {
      type: GraphQLString,
      description: 'The guidance tag ID.',
      resolve: ({ tagId }) => tagId,
    },
    tagName: {
      type: GraphQLString,
      description: 'The guidance tag name.',
      resolve: ({ tagName }) => tagName,
    },
    guidance: {
      type: GraphQLString,
      description:
        'Guidance for changes to record, or to maintain current stance.',
      resolve: ({ guidance }) => guidance,
    },
    refLinksTitle: {
      type: GraphQLString,
      description: 'Title of the implementation guide link.',
      resolve: ({ refLinksTitle }) => refLinksTitle,
    },
    refLinksUrl: {
      type: GraphQLString,
      description: 'URL of the implementation guide.',
      resolve: ({ refLinksUrl }) => refLinksUrl,
    },
    refLinksTechTitle: {
      type: GraphQLString,
      description: 'Title of the technical document for the given tag.',
      resolve: ({ refLinksTechTitle }) => refLinksTechTitle,
    },
    refLinksTechUrl: {
      type: GraphQLString,
      description: 'URL of the technical document for the given tag.',
      resolve: ({ refLinksTechUrl }) => refLinksTechUrl,
    },
  }),
})

module.exports = {
  guidanceTagType,
}
