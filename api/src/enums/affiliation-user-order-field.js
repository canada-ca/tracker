import { GraphQLEnumType } from 'graphql'

export const AffiliationUserOrderField = new GraphQLEnumType({
  name: 'AffiliationUserOrderField',
  description: 'Properties by which affiliation connections can be ordered.',
  values: {
    USER_USERNAME: {
      value: 'user-username',
      description: 'Order affiliation edges by username.',
    },
  },
})
