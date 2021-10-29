import { GraphQLObjectType, GraphQLString } from 'graphql'
import { userPersonalType } from './user-personal'

export const updateUserProfileResultType = new GraphQLObjectType({
  name: 'UpdateUserProfileResult',
  description:
    'This object is used to inform the user that no errors were encountered while resetting their password.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the password reset was successful, and to redirect to sign in page.',
      resolve: ({ status }) => status,
    },
    user: {
      type: userPersonalType,
      description: 'Return the newly updated user information.',
      resolve: ({ user }) => user,
    },
  }),
})
