import { GraphQLUnionType } from 'graphql'
import { organizationErrorType, organizationType } from '../objects'

export const createOrganizationUnion = new GraphQLUnionType({
  name: 'CreateOrganizationUnion',
  description: `This union is used with the \`CreateOrganization\` mutation, 
allowing for users to create an organization, and support any errors that may occur`,
  types: [organizationErrorType, organizationType],
  resolveType({ _type }) {
    if (_type === 'organization') {
      return organizationType
    } else {
      return organizationErrorType
    }
  },
})
