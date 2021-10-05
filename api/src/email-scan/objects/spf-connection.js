import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { spfType } from './spf'

export const spfConnection = connectionDefinitions({
  name: 'SPF',
  nodeType: spfType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of spf scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
