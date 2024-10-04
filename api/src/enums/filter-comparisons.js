import { GraphQLEnumType } from 'graphql'

export const ComparisonEnums = new GraphQLEnumType({
  name: 'ComparisonEnums',
  values: {
    EQUAL: {
      value: '==',
      description: '',
    },
    NOT_EQUAL: {
      value: '!=',
      description: '',
    },
  },
  description: '',
})
