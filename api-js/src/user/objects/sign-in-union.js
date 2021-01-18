import { GraphQLObjectType, GraphQLString, GraphQLUnionType } from 'graphql'
import { authResultType } from './auth-result'

export const regularSignInResult = new GraphQLObjectType({
  name: 'RegularSignInResult',
  description:
    'This object is used when a user has not validated via email or phone.',
  fields: () => ({
    authResult: {
      type: authResultType,
      description: 'The authenticated users information, and JWT.',
      resolve: ({ authResult }) => authResult,
    },
  }),
})

export const tfaSignInResult = new GraphQLObjectType({
  name: 'TFASignInResult',
  description:
    'This object is used when the user has validated either their email or phone.',
  fields: () => ({
    authenticateToken: {
      type: GraphQLString,
      description: 'Token used to verify during authentication.',
      resolve: ({ authenticateToken }) => authenticateToken,
    },
    sendMethod: {
      type: GraphQLString,
      description:
        'Wether the authentication code was sent through text, or email.',
      resolve: ({ sendMethod }) => sendMethod,
    },
  }),
})

export const signInUnion = new GraphQLUnionType({
  name: 'SignInUnion',
  description:
    'This union is used when signing in to allow non-tfa users to still sign in.',
  types: [regularSignInResult, tfaSignInResult],
  resolveType(value) {
    if ('sendMethod' in value) {
      return tfaSignInResult
    } else {
      return regularSignInResult
    }
  },
})
