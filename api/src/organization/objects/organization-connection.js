import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { organizationType } from './organization'

export const organizationConnection = connectionDefinitions({
  name: 'Organization',
  nodeType: organizationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of organizations the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
