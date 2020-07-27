const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
} = require('graphql')

const summaryCategoryType = new GraphQLObjectType({
  name: 'SummaryCategory',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: `Category of computed summary which the other fields relate to.`,
      resolve: async () => {},
    },
    count: {
      type: GraphQLInt,
      description: `Total count of domains that fall into this category.`,
      resolve: async () => {},
    },
    percentage: {
      type: GraphQLFloat,
      description: `Percentage compared to other categories.`,
      resolve: async () => {},
    },
  }),
  description: `This object contains the information for each type of summary that has been pre-computed`,
})

module.exports = {
  summaryCategoryType,
}
