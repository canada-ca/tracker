import { GraphQLEnumType } from 'graphql'

export const DnsOrderField = new GraphQLEnumType({
  name: 'DNSOrderField',
  description: 'Properties by which DNS connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order DNS edges by timestamp.',
    },
  }
})
