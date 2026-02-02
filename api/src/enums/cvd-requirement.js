import { GraphQLEnumType } from 'graphql'

export const CvdRequirementEnums = new GraphQLEnumType({
  name: 'CvdRequirementEnums',
  values: {
    NONE: {
      value: 'none',
      description: 'No additional CVSS environmental requirement for this asset.',
    },
    LOW: {
      value: 'low',
      description: 'Low CVSS environmental requirement for this asset.',
    },
    HIGH: {
      value: 'high',
      description: 'High CVSS environmental requirement for this asset.',
    },
  },
  description: 'Enumerates the CVSS environmental requirement levels for CVD-enrolled assets.',
})
