import { GraphQLObjectType, GraphQLString } from 'graphql'

export const domainBulkResultType = new GraphQLObjectType({
  name: 'DomainBulkResult',
  description:
    'This object is used to inform the user that no errors were encountered while mutating a domain.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the domain mutation was successful.',
      resolve: ({ status }) => status,
    },
  }),
})
