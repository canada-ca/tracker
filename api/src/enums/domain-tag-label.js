import { GraphQLEnumType } from 'graphql'

export const TagLabelEnums = new GraphQLEnumType({
  name: 'TagLabelEnums',
  values: {
    NEW: {
      value: { en: 'NEW', fr: 'NOUVEAU' },
      description: 'Label for tagging domains as new to the system.',
    },
    PROD: {
      value: { en: 'PROD', fr: 'PROD' },
      description: 'Label for tagging domains as a production environment.',
    },
    STAGING: {
      value: { en: 'STAGING', fr: 'DÉVELOPPEMENT' },
      description: 'Label for tagging domains as a staging environment.',
    },
    TEST: {
      value: { en: 'TEST', fr: 'TEST' },
      description: 'Label for tagging domains as a test environment.',
    },
    WEB: {
      value: { en: 'WEB', fr: 'WEB' },
      description: 'Label for tagging domains as web-hosting.',
    },
    INACTIVE: {
      value: { en: 'INACTIVE', fr: 'INACTIF' },
      description: 'Label for tagging domains that are not active.',
    },
  },
  description: 'An enum used to assign and test user-generated domain tags',
})
