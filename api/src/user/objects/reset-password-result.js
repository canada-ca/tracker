import {GraphQLObjectType, GraphQLString} from 'graphql'

export const resetPasswordResultType = new GraphQLObjectType({
  name: 'ResetPasswordResult',
  description:
    'This object is used to inform the user that no errors were encountered while resetting their password.',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the password reset was successful, and to redirect to sign in page.',
      resolve: (payload) => payload.status,
    },
  }),
})
