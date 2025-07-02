import { GraphQLEnumType } from 'graphql'

export const DomainTagLabel = new GraphQLEnumType({
  name: 'DomainTagLabel',
  values: {
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
    CVE_DETECTED: {
      value: 'cve-detected',
      description: 'Label for tagging domains that have vulnerabilities.',
    },
  },
  description: 'An enum used to assign and test user-generated domain tags',
})
