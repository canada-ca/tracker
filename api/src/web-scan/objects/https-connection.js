import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { httpsType } from './https'

export const httpsConnection = connectionDefinitions({
  name: 'HTTPS',
  nodeType: httpsType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
