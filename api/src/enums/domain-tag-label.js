import { GraphQLEnumType } from 'graphql'

export const TagLabelEnums = new GraphQLEnumType({
  name: 'TagLabelEnums',
  values: {
    NEW: {
      value: 'new',
      description: 'Label for tagging domains as new to the system.',
    },
    PROD: {
      value: 'prod',
      description: 'Label for tagging domains as a production environment.',
    },
    STAGING: {
      value: 'STAGING',
      description: 'Label for tagging domains as a staging environment.',
    },
    TEST: {
      value: 'TEST',
      description: 'Label for tagging domains as a test environment.',
    },
    WEB: {
      value: 'web',
      description: 'Label for tagging domains as web-hosting.',
    },
    PARKED: {
      value: 'parked',
      description: 'Label for tagging domains that are not active.',
    },
  },
  description: 'An enum used to assign and test user-generated domain tags',
})
