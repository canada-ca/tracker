import { GraphQLUnionType } from 'graphql'
import { domainErrorType, domainResultType } from '../objects'

export const updateDomainResultUnion = new GraphQLUnionType({
  name: 'UpdateDomainResultUnion',
  description: `This union is used to show the result of mutating a domain and returns a status for the result of the mutation.`,
  types: [domainErrorType, domainResultType],
  resolveType({ _type }) {
    if (_type === 'result') {
      return domainResultType
    } else {
      return domainErrorType
    }
  },
})
