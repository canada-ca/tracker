import { GraphQLObjectType, GraphQLString } from 'graphql'

import { domainType } from './domain'

export const domainResultType = new GraphQLObjectType({
  name: 'DomainResult',
  description:
    'This object is used to inform the user that no errors were encountered while removing a domain.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the domain removal was successful.',
      resolve: ({ status }) => status,
    },
    domain: {
      type: domainType,
      description: 'The domain that is being mutated.',
      resolve: ({ domain }) => domain,
    },
  }),
})
