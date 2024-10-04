import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { spfFailureTableType } from './spf-failure-table'

export const spfFailureConnection = connectionDefinitions({
  name: 'SpfFailureTable',
  nodeType: spfFailureTableType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of spf failures the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
