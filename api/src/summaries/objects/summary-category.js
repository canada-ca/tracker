import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLFloat,
} from 'graphql'

export const summaryCategoryType = new GraphQLObjectType({
  name: 'SummaryCategory',
  fields: () => ({
    name: {
      type: GraphQLString,
      description: `Category of computed summary which the other fields relate to.`,
      resolve: ({name}) => name,
    },
    count: {
      type: GraphQLInt,
      description: `Total count of domains that fall into this category.`,
      resolve: ({count}) => count,
    },
    percentage: {
      type: GraphQLFloat,
      description: `Percentage compared to other categories.`,
      resolve: ({percentage}) => percentage,
    },
  }),
  description: `This object contains the information for each type of summary that has been pre-computed`,
})
