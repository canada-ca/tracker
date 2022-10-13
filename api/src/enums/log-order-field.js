import { GraphQLEnumType } from 'graphql'

export const LogOrderField = new GraphQLEnumType({
  name: 'LogOrderField',
  description: 'Properties by which domain connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order domains by spf status.',
    },
    INITIATED_BY: {
      value: 'initiated_by',
      description: 'Order domains by spf status.',
    },
    RESOURCE_NAME: {
      value: 'resource_name',
      description: 'Order domains by spf status.',
    },
    STATUS: {
      value: 'status',
      description: 'Order domains by spf status.',
    },
  },
})
