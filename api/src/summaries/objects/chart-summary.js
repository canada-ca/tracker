import { GraphQLObjectType } from 'graphql'
import { categorizedSummaryType } from './categorized-summary'
import { globalIdField } from 'graphql-relay'
import { GraphQLDate } from 'graphql-scalars'

export const chartSummaryType = new GraphQLObjectType({
  name: 'ChartSummary',
  fields: () => ({
    id: globalIdField('chartSummary'),
    date: {
      type: GraphQLDate,
      description: 'Date that the summary was computed.',
      resolve: ({ date }) => date,
    },
    https: {
      type: categorizedSummaryType,
      description: 'https summary data',
    },
    dmarc: {
      type: categorizedSummaryType,
      description: 'dmarc summary data',
    },
  }),
  description: `This object contains the information for each type of summary that has been pre-computed`,
})
