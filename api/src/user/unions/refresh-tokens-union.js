import {GraphQLUnionType} from 'graphql'
import {authResultType, authenticateError} from '../objects'

export const refreshTokensUnion = new GraphQLUnionType({
  name: 'RefreshTokensUnion',
  description:
    'This union is used with the `refreshTokens` mutation, allowing for the user to refresh their tokens, and support any errors that may occur',
  types: [authResultType, authenticateError],
  resolveType({_type}) {
    if (_type === 'authResult') {
      return authResultType
    } else {
      return authenticateError
    }
  },
})
