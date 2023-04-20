import {GraphQLUnionType} from 'graphql'
import {authResultType, signUpError} from '../objects'

export const signUpUnion = new GraphQLUnionType({
  name: 'SignUpUnion',
  description:
    'This union is used with the `signUp` mutation, allowing for the user to sign up, and support any errors that may occur.',
  types: [authResultType, signUpError],
  resolveType({_type}) {
    if (_type === 'authResult') {
      return authResultType
    } else {
      return signUpError
    }
  },
})
