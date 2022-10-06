import { GraphQLEnumType } from 'graphql'

export const LogOrderField = new GraphQLEnumType({
  name: 'LogOrderField',
  description: 'Properties by which domain connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order domains by spf status.',
    },
  },
})
