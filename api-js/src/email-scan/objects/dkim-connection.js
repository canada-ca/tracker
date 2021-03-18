import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { dkimType } from './dkim'

export const dkimConnection = connectionDefinitions({
  name: 'DKIM',
  nodeType: dkimType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dkim scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
