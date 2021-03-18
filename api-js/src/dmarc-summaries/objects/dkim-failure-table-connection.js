import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { dkimFailureTableType } from './dkim-failure-table'

export const dkimFailureConnection = connectionDefinitions({
  name: 'DkimFailureTable',
  nodeType: dkimFailureTableType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dkim failure the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
