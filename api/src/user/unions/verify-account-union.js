import { GraphQLUnionType } from 'graphql'
import { verifyAccountErrorType, verifyAccountResultType } from '../objects'

export const verifyAccountUnion = new GraphQLUnionType({
  name: 'VerifyAccountUnion',
  description:
    'This union is used with the `verifyAccount` mutation, allowing for users to verify their account, and support any errors that may occur',
  types: [verifyAccountErrorType, verifyAccountResultType],
  resolveType({ _type }) {
    if (_type === 'success') {
      return verifyAccountResultType
    } else {
      return verifyAccountErrorType
    }
  },
})
