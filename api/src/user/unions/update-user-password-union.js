import { GraphQLUnionType } from 'graphql'
import {
  updateUserPasswordErrorType,
  updateUserPasswordResultType,
} from '../objects'

export const updateUserPasswordUnion = new GraphQLUnionType({
  name: 'UpdateUserPasswordUnion',
  description:
    'This union is used with the `updateUserPassword` mutation, allowing for users to update their password, and support any errors that may occur',
  types: [updateUserPasswordErrorType, updateUserPasswordResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return updateUserPasswordResultType
    } else {
      return updateUserPasswordErrorType
    }
  },
})
