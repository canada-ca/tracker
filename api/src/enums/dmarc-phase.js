import { GraphQLEnumType } from 'graphql'

export const DmarcPhaseEnum = new GraphQLEnumType({
  name: 'DmarcPhaseEnum',
  description: '',
  values: {
    ASSESS: {
      value: 'assess',
      description: '',
    },
    DEPLOY: {
      value: 'deploy',
      description: '',
    },
    ENFORCE: {
      value: 'enforce',
      description: '',
    },
    MAINTAIN: {
      value: 'maintain',
      description: '',
    },
  },
})
