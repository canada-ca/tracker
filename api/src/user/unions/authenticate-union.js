import {GraphQLUnionType} from 'graphql'
import {authResultType, authenticateError} from '../objects'

export const authenticateUnion = new GraphQLUnionType({
  name: 'AuthenticateUnion',
  description:
    'This union is used with the `authenticate` mutation, allowing for the user to authenticate, and support any errors that may occur',
  types: [authResultType, authenticateError],
  resolveType({_type}) {
    if (_type === 'authResult') {
      return authResultType
    } else {
      return authenticateError
    }
  },
})
