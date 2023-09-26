import { GraphQLUnionType } from 'graphql'
import { signUpError, tfaSignInResult } from '../objects'

export const signUpUnion = new GraphQLUnionType({
  name: 'SignUpUnion',
  description:
    'This union is used with the `signUp` mutation, allowing for the user to sign up, and support any errors that may occur.',
  types: [tfaSignInResult, signUpError],
  resolveType({ _type }) {
    if (_type === 'tfaSignInResult') {
      return tfaSignInResult.name
    } else {
      return signUpError.name
    }
  },
})
