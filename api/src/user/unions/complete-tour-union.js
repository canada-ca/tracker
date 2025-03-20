import { GraphQLUnionType } from 'graphql'
import { completeTourError, completeTourResult } from '../objects'

export const completeTourUnion = new GraphQLUnionType({
  name: 'CompleteTourUnion',
  description:
    'This union is used to inform the user if confirming that they have completed the tour was successful or not.',
  types: [completeTourResult, completeTourError],
  resolveType({ _type }) {
    if (_type === 'success') {
      return completeTourResult.name
    } else {
      return completeTourError.name
    }
  },
})
