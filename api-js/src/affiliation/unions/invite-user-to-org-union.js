import { GraphQLUnionType } from 'graphql'
import { affiliationError, inviteUserToOrgResultType } from '../objects'

export const inviteUserToOrgUnion = new GraphQLUnionType({
  name: 'InviteUserToOrgUnion',
  description:
    'This union is used with the `InviteUserToOrg` mutation, allowing for users to invite user to their org, and support any errors that may occur',
  types: [affiliationError, inviteUserToOrgResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return inviteUserToOrgResultType
    } else {
      return affiliationError
    }
  },
})
