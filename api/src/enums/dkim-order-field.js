import {GraphQLEnumType} from 'graphql'

export const DkimOrderField = new GraphQLEnumType({
  name: 'DKIMOrderField',
  description: 'Properties by which DKIM connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order DKIM edges by timestamp.',
    },
  },
})
