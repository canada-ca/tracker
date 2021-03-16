import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { fullPassTableType } from './full-pass-table'

export const fullPassConnection = connectionDefinitions({
  name: 'FullPassTable',
  nodeType: fullPassTableType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of full passes the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
