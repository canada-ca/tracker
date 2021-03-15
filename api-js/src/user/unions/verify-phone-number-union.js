import { GraphQLUnionType } from 'graphql'
import {
  verifyPhoneNumberErrorType,
  verifyPhoneNumberResultType,
} from '../objects'

export const verifyPhoneNumberUnion = new GraphQLUnionType({
  name: 'VerifyPhoneNumberUnion',
  description:
    'This union is used with the `verifyPhoneNumber` mutation, allowing for users to verify their phone number, and support any errors that may occur',
  types: [verifyPhoneNumberErrorType, verifyPhoneNumberResultType],
  resolveType({ _type }) {
    if (_type === 'success') {
      return verifyPhoneNumberResultType
    } else {
      return verifyPhoneNumberErrorType
    }
  },
})
