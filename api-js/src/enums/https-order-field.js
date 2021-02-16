import { GraphQLEnumType } from 'graphql'

export const HttpsOrderField = new GraphQLEnumType({
  name: 'HTTPSOrderField',
  description: 'Properties by which HTTPS connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order HTTPS edges by timestamp.',
    },
    IMPLEMENTATION: {
      value: 'implementation',
      description: 'Order HTTPS edges by implementation.',
    },
    ENFORCED: {
      value: 'enforced',
      description: 'Order HTTPS edges by enforced.',
    },
    HSTS: {
      value: 'hsts',
      description: 'Order HTTPS edges by hsts.',
    },
    HSTS_AGE: {
      value: 'hsts-age',
      description: 'Order HTTPS edges by hsts age.',
    },
    PRELOADED: {
      value: 'preloaded',
      description: 'Order HTTPS edges by preloaded.',
    },
  },
})
