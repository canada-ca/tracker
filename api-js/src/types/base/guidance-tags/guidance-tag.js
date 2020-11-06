const { GraphQLObjectType, GraphQLString, GraphQLList } = require('graphql')
const { refLinksType } = require('./ref-links')

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
    refLinks: {
      type: GraphQLList(refLinksType),
      description: 'Links to implementation guidance for a given tag.',
      resolve: ({ refLinksGuide }) => refLinksGuide,
    },
    refLinksTech: {
      type: GraphQLList(refLinksType),
      description: 'Links to technical information for a given tag.',
      resolve: ({ refLinksTechnical }) => refLinksTechnical,
    },
  }),
})

module.exports = {
  guidanceTagType,
}
