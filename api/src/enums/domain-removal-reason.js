import { GraphQLEnumType } from 'graphql'

export const DomainRemovalReasonEnum = new GraphQLEnumType({
  name: 'DomainRemovalReasonEnum',
  values: {
    NONEXISTENT: {
      value: 'nonexistent',
      description: '',
    },
    WRONG_ORG: {
      value: 'wrong_org',
      description: '',
    },
  },
  description: '',
})
