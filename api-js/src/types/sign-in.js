const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} = require('graphql')
const { authResultType } = require('./auth-result')

const regularSignInResult = new GraphQLObjectType({
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

const tfaSignInResult = new GraphQLObjectType({
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

const signInUnion = new GraphQLUnionType({
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

module.exports = {
  signInUnion,
  regularSignInResult,
  tfaSignInResult,
}
