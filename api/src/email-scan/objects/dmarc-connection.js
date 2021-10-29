import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { dmarcType } from './dmarc'

export const dmarcConnection = connectionDefinitions({
  name: 'DMARC',
  nodeType: dmarcType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dmarc scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
