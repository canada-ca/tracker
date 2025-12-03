import { GraphQLEnumType } from 'graphql'

export const DmarcPhaseEnum = new GraphQLEnumType({
  name: 'DmarcPhaseEnum',
  description: 'Phases of DMARC implementation.',
  values: {
    ASSESS: {
      value: 'assess',
      description: 'Assess domains and DMARC status.',
    },
    DEPLOY: {
      value: 'deploy',
      description: 'Deploy SPF and DKIM records.',
    },
    ENFORCE: {
      value: 'enforce',
      description: 'Enforce DMARC policies.',
    },
    MAINTAIN: {
      value: 'maintain',
      description: 'Maintain DMARC and update records.',
    },
  },
})
