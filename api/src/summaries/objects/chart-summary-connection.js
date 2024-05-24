import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { chartSummaryType } from './chart-summary'

export const chartSummaryConnection = connectionDefinitions({
  name: 'ChartSummary',
  nodeType: chartSummaryType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dmarc summaries the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
