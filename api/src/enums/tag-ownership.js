import { GraphQLEnumType } from 'graphql'

export const TagOwnershipEnums = new GraphQLEnumType({
  name: 'TagOwnershipEnums',
  values: {
    GLOBAL: {
      value: 'global',
      description: '',
    },
    ORG: {
      value: 'org',
      description: '',
    },
    PENDING: {
      value: 'pending',
      description: '',
    },
  },
  description: '',
})
