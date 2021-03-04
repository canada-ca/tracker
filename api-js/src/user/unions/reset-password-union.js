import { GraphQLUnionType } from 'graphql'
import { resetPasswordError, resetPasswordResult } from '../objects'

export const resetPasswordUnion = new GraphQLUnionType({
  name: 'ResetPasswordUnion',
  description:
    'This union is used with the `resetPassword` mutation, allowing for users to reset their password, and support any errors that may occur',
  types: [resetPasswordError, resetPasswordResult],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return resetPasswordResult
    } else {
      return resetPasswordError
    }
  },
})
