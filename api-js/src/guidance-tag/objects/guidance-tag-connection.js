import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { guidanceTagType } from './guidance-tag'

export const guidanceTagConnection = connectionDefinitions({
  name: 'GuidanceTag',
  nodeType: guidanceTagType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of guidance tags for a given scan type.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
