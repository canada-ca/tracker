import {GraphQLUnionType} from 'graphql'
import {
  removePhoneNumberErrorType,
  removePhoneNumberResultType,
} from '../objects'

export const removePhoneNumberUnion = new GraphQLUnionType({
  name: 'RemovePhoneNumberUnion',
  description:
    'This union is used with the `RemovePhoneNumber` mutation, allowing for users to remove their phone number, and support any errors that may occur',
  types: [removePhoneNumberErrorType, removePhoneNumberResultType],
  resolveType({_type}) {
    if (_type === 'result') {
      return removePhoneNumberResultType
    } else {
      return removePhoneNumberErrorType
    }
  },
})
