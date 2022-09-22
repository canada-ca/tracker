import {GraphQLUnionType} from 'graphql'
import {domainErrorType, domainType} from '../objects'

export const createDomainUnion = new GraphQLUnionType({
  name: 'CreateDomainUnion',
  description: `This union is used with the \`CreateDomain\` mutation,
allowing for users to create a domain and add it to their org,
and support any errors that may occur`,
  types: [domainErrorType, domainType],
  resolveType({_type}) {
    if (_type === 'domain') {
      return domainType
    } else {
      return domainErrorType
    }
  },
})
