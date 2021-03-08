import { GraphQLUnionType } from 'graphql'
import {
  updateUserProfileErrorType,
  updateUserProfileResultType,
} from '../objects'

export const updateUserProfileUnion = new GraphQLUnionType({
  name: 'UpdateUserProfileUnion',
  description:
    'This union is used with the `updateUserProfile` mutation, allowing for users to update their profile, and support any errors that may occur',
  types: [updateUserProfileErrorType, updateUserProfileResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return updateUserProfileResultType
    } else {
      return updateUserProfileErrorType
    }
  },
})
