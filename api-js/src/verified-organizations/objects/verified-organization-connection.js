import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { verifiedOrganizationType } from './verified-organization'

export const verifiedOrganizationConnection = connectionDefinitions({
  name: 'VerifiedOrganization',
  nodeType: verifiedOrganizationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of verified organizations.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
