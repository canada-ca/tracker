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
      description: 'Bilingual Label for tagging domains as a production environment.',
    },
    STAGING: {
      value: 'STAGING',
      description: 'English label for tagging domains as a staging environment.',
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
    ARCHIVED: {
      value: 'archived',
      description: 'English label for tagging domains that are archived.',
    },
    NXDOMAIN: {
      value: 'nxdomain',
      description: 'Label for tagging domains that have an rcode status of NXDOMAIN.',
    },
    BLOCKED: {
      value: 'blocked',
      description: 'Label for tagging domains that are possibly blocked by a firewall.',
    },
    WILDCARD_SIBLING: {
      value: 'wildcard-sibling',
      description: 'Label for tagging domains that have a wildcard sibling.',
    },
    WILDCARD_ENTRY: {
      value: 'wildcard-entry',
      description: 'Label for tagging domains that have a wildcard entry.',
    },
    SCAN_PENDING: {
      value: 'scan-pending',
      description: 'Label for tagging domains that have a pending web scan.',
    },
    HAS_ENTRUST_CERTIFICATE: {
      value: 'has-entrust-certificate',
      description: 'Label for tagging domains that have an Entrust certificate.',
    },
    CVE_DETECTED: {
      value: 'cve-detected',
      description: 'Label for tagging domains that have vulnerabilities.',
    },
  },
  description: 'An enum used to assign and test user-generated domain tags',
})
