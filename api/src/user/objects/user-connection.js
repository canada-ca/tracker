import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { userSharedType } from './user-shared'

export const userConnection = connectionDefinitions({
  name: 'User',
  nodeType: userSharedType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of users the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
