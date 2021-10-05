import { GraphQLUnionType } from 'graphql'
import { organizationErrorType, organizationType } from '../objects'

export const updateOrganizationUnion = new GraphQLUnionType({
  name: 'UpdateOrganizationUnion',
  description: `This union is used with the \`UpdateOrganization\` mutation, 
allowing for users to update an organization, and support any errors that may occur`,
  types: [organizationErrorType, organizationType],
  resolveType({ _type }) {
    if (_type === 'organization') {
      return organizationType
    } else {
      return organizationErrorType
    }
  },
})
