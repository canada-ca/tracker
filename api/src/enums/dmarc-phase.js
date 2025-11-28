import { GraphQLEnumType } from 'graphql'

export const DmarcPhaseEnums = new GraphQLEnumType({
  name: 'DmarcPhaseEnums',
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
