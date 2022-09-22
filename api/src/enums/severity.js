import {GraphQLEnumType} from 'graphql'

export const SeverityEnum = new GraphQLEnumType({
  name: 'SeverityEnum',
  values: {
    LOW: {
      value: 'low',
      description: 'If the given CVE is of a low level severity',
    },
    MEDIUM: {
      value: 'medium',
      description: 'If the given CVE is of a medium level severity',
    },
    HIGH: {
      value: 'high',
      description: 'If the given CVE is of a high level severity',
    },
    CRITICAL: {
      value: 'critical',
      description: 'If the given cve is of a critical level severity',
    },
  },
  description:
    'Enum used to inform front end of the level of severity of a given vulnerability for a domain',
})
