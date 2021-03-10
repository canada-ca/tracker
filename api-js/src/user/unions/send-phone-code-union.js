import { GraphQLUnionType } from 'graphql'
import { sendPhoneCodeErrorType, sendPhoneCodeResultType } from '../objects'

export const sendPhoneCodeUnion = new GraphQLUnionType({
  name: 'SendPhoneCodeUnion',
  description:
    'This union is used with the `sendPhoneCode` mutation, allowing for users to send a verification code to their phone, and support any errors that may occur',
  types: [sendPhoneCodeErrorType, sendPhoneCodeResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return sendPhoneCodeResultType
    } else {
      return sendPhoneCodeErrorType
    }
  },
})
