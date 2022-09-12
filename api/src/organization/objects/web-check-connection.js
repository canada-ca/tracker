import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { webCheckType } from './web-check-organization'

export const webCheckConnection = connectionDefinitions({
  name: 'WebCheckOrg',
  nodeType: webCheckType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of organizations the user has access to.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
