import { GraphQLUnionType } from 'graphql'
import { authResultType, signInError, tfaSignInResult } from '../objects'

export const signInUnion = new GraphQLUnionType({
  name: 'SignInUnion',
  description:
    'This union is used with the `SignIn` mutation, allowing for multiple styles of logging in, and support any errors that may occur',
  types: [authResultType, signInError, tfaSignInResult],
  resolveType({ _type }) {
    if (_type === 'tfa') {
      return tfaSignInResult
    } else if (_type === 'regular') {
      return authResultType
    } else {
      return signInError
    }
  },
})
