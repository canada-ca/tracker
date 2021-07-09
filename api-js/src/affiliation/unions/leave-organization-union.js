import { GraphQLUnionType } from 'graphql'

import { affiliationError, leaveOrganizationResultType } from '../objects'

export const leaveOrganizationUnion = new GraphQLUnionType({
  name: 'LeaveOrganizationUnion',
  description:
    'This union is used with the `leaveOrganization` mutation, allowing for users to leave a given organization, and support any errors that may occur.',
  types: [affiliationError, leaveOrganizationResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return leaveOrganizationResultType
    } else {
      return affiliationError
    }
  },
})
