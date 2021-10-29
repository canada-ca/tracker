import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { dmarcSummaryType } from './dmarc-summary'

export const dmarcSummaryConnection = connectionDefinitions({
  name: 'DmarcSummary',
  nodeType: dmarcSummaryType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description:
        'The total amount of dmarc summaries the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
