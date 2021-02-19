import { GraphQLEnumType } from 'graphql'

export const SpfOrderField = new GraphQLEnumType({
  name: 'SPFOrderField',
  description: 'Properties by which SPF connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order SPF edges by timestamp.',
    },
    LOOKUPS: {
      value: 'lookups',
      description: 'Order SPF edges by lookups.',
    },
    RECORD: {
      value: 'record',
      description: 'Order SPF edges by record.',
    },
    SPF_DEFAULT: {
      value: 'spf-default',
      description: 'Order SPF edges by spf-default.',
    },
  },
})
