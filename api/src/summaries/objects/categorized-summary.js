import {GraphQLObjectType, GraphQLList, GraphQLInt} from 'graphql'
import {summaryCategoryType} from './summary-category'

export const categorizedSummaryType = new GraphQLObjectType({
  name: 'CategorizedSummary',
  fields: () => ({
    categories: {
      type: GraphQLList(summaryCategoryType),
      description: `List of SummaryCategory objects with data for different computed categories.`,
      resolve: ({categories}) => categories,
    },
    total: {
      type: GraphQLInt,
      description: `Total domains that were check under this summary.`,
      resolve: ({total}) => total,
    },
  }),
  description: `This object contains the list of different categories for pre-computed
    summary data with the computed total for how many domains in total are
    being compared.`,
})
