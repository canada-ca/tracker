import { GraphQLEnumType } from 'graphql'

export const ResourceTypeEnums = new GraphQLEnumType({
  name: 'ResourceTypeEnums',
  values: {
    USER: {
      value: 'user',
      description: 'A user account affiliated with an organization.',
    },
    ORGANIZATION: {
      value: 'organization',
      description: 'An organization.',
    },
    DOMAIN: {
      value: 'domain',
      description: 'A domain affiliated with an organization.',
    },
  },
  description: 'Keywords used to decribe resources that can be modified.',
})
