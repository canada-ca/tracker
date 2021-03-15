import { GraphQLUnionType } from 'graphql'
import { setPhoneNumberErrorType, setPhoneNumberResultType } from '../objects'

export const setPhoneNumberUnion = new GraphQLUnionType({
  name: 'SetPhoneNumberUnion',
  description:
    'This union is used with the `setPhoneNumber` mutation, allowing for users to send a verification code to their phone, and support any errors that may occur',
  types: [setPhoneNumberErrorType, setPhoneNumberResultType],
  resolveType({ _type }) {
    if (_type === 'regular') {
      return setPhoneNumberResultType
    } else {
      return setPhoneNumberErrorType
    }
  },
})
