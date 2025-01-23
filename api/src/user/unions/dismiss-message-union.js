import { GraphQLUnionType } from 'graphql'
import { dismissMessageError, dismissMessageResult } from '../objects'

export const dismissMessageUnion = new GraphQLUnionType({
  name: 'DismissMessageUnion',
  description:
    'This union is used to inform the user if the message was successfully dismissed or if any errors occurred while dismissing a message.',
  types: [dismissMessageError, dismissMessageResult],
  resolveType({ _type }) {
    if (_type === 'success') {
      return dismissMessageResult.name
    } else {
      return dismissMessageError.name
    }
  },
})
