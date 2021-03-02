import { GraphQLUnionType } from 'graphql'
import { regularSignInResult, signInError, tfaSignInResult } from '../objects'

export const signInUnion = new GraphQLUnionType({
  name: 'SignInUnion',
  description:
    'This union is used with the `SignIn` mutation, allowing for multiple styles of logging in, and support any errors that may occur',
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
