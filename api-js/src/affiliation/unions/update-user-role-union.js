import { GraphQLUnionType } from 'graphql'
import { updateUserRoleErrorType, updateUserRoleResultType } from '../objects'

export const updateUserRoleUnion = new GraphQLUnionType({
  name: 'UpdateUserRoleUnion',
  description:
    'This union is used with the `UpdateUserRole` mutation, allowing for users to update a users role in an org, and support any errors that may occur',
  types: [updateUserRoleErrorType, updateUserRoleResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return updateUserRoleResultType
    } else {
      return updateUserRoleErrorType
    }
  },
})
