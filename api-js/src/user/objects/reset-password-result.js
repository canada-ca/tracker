import { GraphQLObjectType, GraphQLString } from 'graphql'

export const resetPasswordResult = new GraphQLObjectType({
  name: 'ResetPasswordResult',
  description: '',
  fields: () => ({
    status: {
      type: GraphQLString,
      description:
        'Informs the user if the password reset was successful, and to redirect to sign in page.',
      resolve: (payload) => payload.status,
    },
  }),
})
