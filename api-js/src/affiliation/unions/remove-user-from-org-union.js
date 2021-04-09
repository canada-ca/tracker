import { GraphQLUnionType } from 'graphql'
import { affiliationError, removeUserFromOrgResultType } from '../objects'

export const removeUserFromOrgUnion = new GraphQLUnionType({
  name: 'RemoveUserFromOrgUnion',
  description:
    'This union is used with the `RemoveUserFromOrg` mutation, allowing for users to remove a user from their org, and support any errors that may occur',
  types: [affiliationError, removeUserFromOrgResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return removeUserFromOrgResultType
    } else {
      return affiliationError
    }
  },
})
