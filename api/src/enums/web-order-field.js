import {GraphQLEnumType} from 'graphql'

export const WebOrderField = new GraphQLEnumType({
  name: 'WebOrderField',
  description: 'Properties by which web connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order web edges by timestamp.',
    },
  },
})
