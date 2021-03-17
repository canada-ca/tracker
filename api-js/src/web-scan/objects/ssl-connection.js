import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { sslType } from './ssl'

export const sslConnection = connectionDefinitions({
  name: 'SSL',
  nodeType: sslType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
