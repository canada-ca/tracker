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
    CVD_ENROLLED: {
      value: 'cvd-enrolled',
      description: 'Label for tagging domains that are enrolled in the Coordinated Vulnerability Disclosure program.',
    },
    CVD_DENY: {
      value: 'cvd-deny',
      description:
        'Label for tagging domains that have been explicitly excluded from the Coordinated Vulnerability Disclosure program.',
    },
    POWERED_BY_PHP: {
      value: 'powered-by-php',
      description: 'Label for tagging domains that return a response header including PHP.',
    },
    PHP_VULNERABLE: {
      value: 'php-vulnerable',
      description: 'Label for tagging domains that show a PHP version affected by an open advisory.',
    },
    PHP_UNKNOWN_VERSION: {
      value: 'php-unknown-version',
      description:
        'Label for tagging domains that use PHP without showing a version complete enough to check against the open advisories.',
    },
    PHP_NOT_AFFECTED: {
      value: 'php-not-affected',
      description: 'Label for tagging domains that show a PHP version not affected by any open advisory.',
    },
  },
  description: 'An enum used to assign and test user-generated domain tags',
})
