import { GraphQLEnumType } from 'graphql'

export const OutsideDomainCommentEnum = new GraphQLEnumType({
  name: 'OutsideDomainCommentEnum',
  values: {
    INVESTMENT: {
      value: 'investment',
      description: 'Organization is invested in the outside domain.',
    },
    OWNERSHIP: {
      value: 'ownership',
      description: 'Organization owns this domain, but it is outside the allowed scope.',
    },
    OTHER: {
      value: 'other',
      description: 'Other reason.',
    },
  },
  description: 'Reason why an outside domain was added to the organization.',
})
