import { GraphQLObjectType, GraphQLString } from 'graphql'

export const organizationResultType = new GraphQLObjectType({
  name: 'OrganizationResult',
  description:
    'This object is used to inform the user that no errors were encountered while running organization mutations.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the organization mutation was successful.',
      resolve: ({ status }) => status,
    },
  }),
})
