import { GraphQLInt } from 'graphql'
import { connectionDefinitions } from 'graphql-relay'

import { verifiedDomainType } from './verified-domain'

export const verifiedDomainConnection = connectionDefinitions({
  name: 'VerifiedDomain',
  nodeType: verifiedDomainType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of verified domains.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
