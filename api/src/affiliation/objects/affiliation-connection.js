import {GraphQLInt} from 'graphql'
import {connectionDefinitions} from 'graphql-relay'
import {affiliationType} from './affiliation'

export const affiliationConnection = connectionDefinitions({
  name: 'Affiliation',
  nodeType: affiliationType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of affiliations the user has access to.',
      resolve: ({totalCount}) => totalCount,
    },
  }),
})
