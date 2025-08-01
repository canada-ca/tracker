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
    TAG: {
      value: 'tag',
      description: 'A tag used for organizing domains.',
    },
  },
  description: 'Keywords used to describe resources that can be modified.',
})
