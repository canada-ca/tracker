import { GraphQLObjectType, GraphQLString } from 'graphql'

export const updateUserRoleResultType = new GraphQLObjectType({
  name: 'UpdateUserRoleResult',
  description:
    'This object is used to inform the user of the status of the role update.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description: 'Informs the user if the user was successfully removed.',
      resolve: ({ status }) => status,
    },
  }),
})
