import { GraphQLEnumType } from 'graphql'

export const DomainTagLabel = new GraphQLEnumType({
  name: 'DomainTagLabel',
  values: {
    NEW: {
      value: 'NEW',
      description: 'English label for tagging domains as new to the system.',
    },
    NOUVEAU: {
      value: 'NOUVEAU',
      description: 'French label for tagging domains as new to the system.',
    },
    PROD: {
      value: 'PROD',
      description:
        'Bilingual Label for tagging domains as a production environment.',
    },
    STAGING: {
      value: 'STAGING',
      description:
        'English label for tagging domains as a staging environment.',
    },
    DEV: {
      value: 'DÉV',
      description: 'French label for tagging domains as a staging environment.',
    },
    TEST: {
      value: 'TEST',
      description: 'Bilingual label for tagging domains as a test environment.',
    },
    WEB: {
      value: 'WEB',
      description: 'Bilingual label for tagging domains as web-hosting.',
    },
    INACTIVE: {
      value: 'INACTIVE',
      description: 'English label for tagging domains that are not active.',
    },
    INACTIF: {
      value: 'INACTIF',
      description: 'French label for tagging domains that are not active.',
    },
  },
  description: 'An enum used to assign and test user-generated domain tags',
})
