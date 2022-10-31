import { GraphQLEnumType } from 'graphql'

export const DomainRemovalReasonEnum = new GraphQLEnumType({
  name: 'DomainRemovalReasonEnum',
  values: {
    NONEXISTENT: {
      value: 'nonexistent',
      description: 'Domain does not exist.',
    },
    WRONG_ORG: {
      value: 'wrong_org',
      description: 'Domain was in the incorrect organization.',
    },
  },
  description: 'Reason why a domain was removed from an organization.',
})
