import { GraphQLUnionType } from 'graphql'
import { organizationErrorType, organizationResultType } from '../objects'

export const removeOrganizationUnion = new GraphQLUnionType({
  name: 'RemoveOrganizationUnion',
  description: `This union is used with the \`RemoveOrganization\` mutation, 
allowing for users to remove an organization they belong to, 
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
