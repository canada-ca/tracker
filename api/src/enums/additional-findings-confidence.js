import { GraphQLEnumType } from 'graphql'

export const ConfidenceEnum = new GraphQLEnumType({
  name: 'ConfidenceEnum',
  values: {
    SUSPECTED: {
      value: 'suspected',
      description: '',
    },
    PROBABLE: {
      value: 'probable',
      description: '',
    },
    CONFIRMED: {
      value: 'confirmed',
      description: '',
    },
  },
  description: '',
})
