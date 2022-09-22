import {GraphQLInt} from 'graphql'
import {connectionDefinitions} from 'graphql-relay'

import {domainType} from './domain'

export const domainConnection = connectionDefinitions({
  name: 'Domain',
  nodeType: domainType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of domains the user has access to.',
      resolve: ({totalCount}) => totalCount,
    },
  }),
})
