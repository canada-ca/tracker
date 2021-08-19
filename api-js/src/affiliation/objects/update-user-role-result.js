import { GraphQLObjectType, GraphQLString } from 'graphql'
import { userSharedType } from '../../user/objects'

export const updateUserRoleResultType = new GraphQLObjectType({
  name: 'UpdateUserRoleResult',
  description:
    'This object is used to inform the user of the status of the role update.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        "Informs the user if the user who's role was successfully updated.",
      resolve: ({ status }) => status,
    },
    user: {
      type: userSharedType,
      description: "The user who's role was successfully updated.",
      resolve: ({ user }) => user,
    },
  }),
})
