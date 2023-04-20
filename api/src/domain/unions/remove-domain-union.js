import {GraphQLUnionType} from 'graphql'
import {domainErrorType, domainResultType} from '../objects'

export const removeDomainUnion = new GraphQLUnionType({
  name: 'RemoveDomainUnion',
  description: `This union is used with the \`RemoveDomain\` mutation,
allowing for users to remove a domain belonging to their org,
and support any errors that may occur`,
  types: [domainErrorType, domainResultType],
  resolveType({_type}) {
    if (_type === 'result') {
      return domainResultType
    } else {
      return domainErrorType
    }
  },
})
