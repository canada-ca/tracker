import { GraphQLEnumType } from 'graphql'

export const TagOwnershipEnums = new GraphQLEnumType({
  name: 'TagOwnershipEnums',
  values: {
    GLOBAL: {
      value: 'global',
      description: 'Visible to all users, not affiliated with any organization.',
    },
    ORG: {
      value: 'org',
      description: 'Visible to all users affiliated with an organization.',
    },
    PENDING: {
      value: 'pending',
      description: 'Visible to admins, but not yet affiliated with any organization.',
    },
  },
  description: 'Enum representing the ownership of a tag, determining its visibility and affiliation.',
})
