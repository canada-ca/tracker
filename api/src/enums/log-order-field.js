import { GraphQLEnumType } from 'graphql'

export const LogOrderField = new GraphQLEnumType({
  name: 'LogOrderField',
  description: 'Properties by which domain connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order logs by timestamp.',
    },
    INITIATED_BY: {
      value: 'initiated_by',
      description: "Order logs by initiant's username.",
    },
    RESOURCE_NAME: {
      value: 'resource_name',
      description: 'Order logs by name of targeted resource.',
    },
  },
})
