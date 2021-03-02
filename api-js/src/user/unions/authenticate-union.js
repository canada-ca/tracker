import { GraphQLUnionType } from 'graphql'
import { authResultType, authenticateError } from '../objects'

export const authenticateUnion = new GraphQLUnionType({
  name: 'AuthenticateUnion',
  description: '',
  types: [authResultType, authenticateError],
  resolveType(value) {
    if ('authResult' in value) {
      return authResultType
    } else {
      return authenticateError
    }
  },
})
