import { GraphQLUnionType } from 'graphql'
import { domainErrorType, domainType } from '../objects'

export const updateDomainUnion = new GraphQLUnionType({
  name: 'UpdateDomainUnion',
  description: `This union is used with the \`UpdateDomain\` mutation, 
allowing for users to update a domain belonging to their org, 
and support any errors that may occur`,
  types: [domainErrorType, domainType],
  resolveType({ _type }) {
    if (_type === 'domain') {
      return domainType
    } else {
      return domainErrorType
    }
  },
})
