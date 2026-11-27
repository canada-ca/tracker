import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { additionalFinding } from './additional-finding'

export const additionalFindingConnection = connectionDefinitions({
  name: 'AdditionalFinding',
  nodeType: additionalFinding,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of additional findings related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
