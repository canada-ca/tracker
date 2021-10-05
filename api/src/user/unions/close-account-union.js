import { GraphQLUnionType } from 'graphql'
import { closeAccountError, closeAccountResult } from '../objects'

export const closeAccountUnion = new GraphQLUnionType({
  name: 'CloseAccountUnion',
  description:
    'This union is used for the `closeAccount` mutation, to support successful or errors that may occur.',
  types: [closeAccountResult, closeAccountError],
  resolveType({ _type }) {
    if (_type === 'error') {
      return closeAccountError
    } else {
      return closeAccountResult
    }
  },
})
