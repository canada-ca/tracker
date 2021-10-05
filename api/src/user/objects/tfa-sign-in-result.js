import { GraphQLObjectType, GraphQLString } from 'graphql'

export const tfaSignInResult = new GraphQLObjectType({
  name: 'TFASignInResult',
  description:
    'This object is used when the user signs in and has validated either their email or phone.',
  fields: () => ({
    authenticateToken: {
      type: GraphQLString,
      description: 'Token used to verify during authentication.',
      resolve: ({ authenticateToken }) => authenticateToken,
    },
    sendMethod: {
      type: GraphQLString,
      description:
        'Whether the authentication code was sent through text, or email.',
      resolve: ({ sendMethod }) => sendMethod,
    },
  }),
})
