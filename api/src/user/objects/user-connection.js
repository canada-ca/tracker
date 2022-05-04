import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { userPersonalType } from './user-personal'

export const userConnection = connectionDefinitions({
  name: 'User',
  nodeType: userPersonalType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of users the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
