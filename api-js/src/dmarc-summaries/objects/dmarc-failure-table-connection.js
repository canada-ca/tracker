import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { dmarcFailureTableType } from './dmarc-failure-table'

export const dmarcFailureConnection = connectionDefinitions({
  name: 'DmarcFailureTable',
  nodeType: dmarcFailureTableType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dmarc failures the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
