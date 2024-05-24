import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { organizationSummaryType } from './organization-summary'

export const orgSummaryConnection = connectionDefinitions({
  name: 'OrganizationSummary',
  nodeType: organizationSummaryType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dmarc summaries the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
