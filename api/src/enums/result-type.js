import { GraphQLEnumType } from 'graphql'

export const ResultTypeEnums = new GraphQLEnumType({
  name: 'ResultTypeEnums',
  values: {
    SUCCESS: {
      value: 'success',
      description: '',
    },
    FAILURE: {
      value: 'failure',
      description: '',
    },
  },
  description: '',
})
