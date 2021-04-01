import { GraphQLUnionType } from 'graphql'
import { organizationErrorType, organizationResultType } from '../objects'

export const verifyOrganizationUnion = new GraphQLUnionType({
  name: 'VerifyOrganizationUnion',
  description: `This union is used with the \`VerifyOrganization\` mutation, 
allowing for super admins to verify an organization, 
and support any errors that may occur`,
  types: [organizationErrorType, organizationResultType],
  resolveType({ _type }) {
    if (_type === 'result') {
      return organizationResultType
    } else {
      return organizationErrorType
    }
  },
})
