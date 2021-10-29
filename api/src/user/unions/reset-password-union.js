import { GraphQLUnionType } from 'graphql'
import { resetPasswordErrorType, resetPasswordResultType } from '../objects'

export const resetPasswordUnion = new GraphQLUnionType({
  name: 'ResetPasswordUnion',
  description:
    'This union is used with the `ResetPassword` mutation, allowing for users to reset their password, and support any errors that may occur',
  types: [resetPasswordErrorType, resetPasswordResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return resetPasswordResultType
    } else {
      return resetPasswordErrorType
    }
  },
})
