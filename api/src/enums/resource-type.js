import { GraphQLEnumType } from 'graphql'

export const ResourceTypeEnums = new GraphQLEnumType({
  name: 'ResourceTypeEnums',
  values: {
    USER: {
      value: 'user',
      description: '',
    },
    ORGANIZATION: {
      value: 'organization',
      description: '',
    },
    DOMAIN: {
      value: 'domain',
      description: '',
    },
  },
  description: '',
})
