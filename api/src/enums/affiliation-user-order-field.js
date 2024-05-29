import { GraphQLEnumType } from 'graphql'

export const AffiliationUserOrderField = new GraphQLEnumType({
  name: 'AffiliationUserOrderField',
  description: 'Properties by which affiliation connections can be ordered.',
  values: {
    USERNAME: {
      value: 'username',
      description: 'Order affiliations by username.',
    },
    DISPLAY_NAME: {
      value: 'display_name',
      description: 'Order affiliations by display name.',
    },
    PERMISSION: {
      value: 'permission',
      description: 'Order affiliations by permission.',
    },
  },
})
