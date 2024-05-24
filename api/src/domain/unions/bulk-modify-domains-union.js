import { GraphQLUnionType } from 'graphql'
import { domainErrorType, domainBulkResultType } from '../objects'

export const bulkModifyDomainsUnion = new GraphQLUnionType({
  name: 'BulkModifyDomainsUnion',
  description: `This union is used with the \`AddOrganizationsDomains\` and \`RemoveOrganizationsDomains\` mutation, 
                allowing for users to add/remove multiple domains belonging to their org, 
                and support any errors that may occur`,
  types: [domainErrorType, domainBulkResultType],
  resolveType({ _type }) {
    if (_type === 'result') {
      return domainBulkResultType.name
    } else {
      return domainErrorType.name
    }
  },
})
