import { GraphQLUnionType } from 'graphql'
import { inviteUserToOrgError, inviteUserToOrgResultType } from '../objects'

export const inviteUserToOrgUnion = new GraphQLUnionType({
  name: 'InviteUserToOrgUnion',
  description:
    'This union is used with the `InviteUserToOrg` mutation, allowing for users to invite user to their org, and support any errors that may occur',
  types: [inviteUserToOrgError, inviteUserToOrgResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return inviteUserToOrgResultType
    } else {
      return inviteUserToOrgError
    }
  },
})
