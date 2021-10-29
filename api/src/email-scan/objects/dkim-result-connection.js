import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { dkimResultType } from './dkim-result'

export const dkimResultConnection = connectionDefinitions({
  name: 'DKIMResult',
  nodeType: dkimResultType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description:
        'The total amount of dkim results related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
