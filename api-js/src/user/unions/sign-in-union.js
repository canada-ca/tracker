import { GraphQLUnionType } from 'graphql'
import { regularSignInResult, signInError, tfaSignInResult } from '../objects'

export const signInUnion = new GraphQLUnionType({
  name: 'SignInUnion',
  description:
    'This union is used when signing in to allow non-tfa users to still sign in.',
  types: [regularSignInResult, signInError, tfaSignInResult],
  resolveType(value) {
    if ('sendMethod' in value) {
      return tfaSignInResult
    } else if ('authResult' in value) {
      return regularSignInResult
    } else {
      return signInError
    }
  },
})
