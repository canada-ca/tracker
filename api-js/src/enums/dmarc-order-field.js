import { GraphQLEnumType } from 'graphql'

export const DmarcOrderField = new GraphQLEnumType({
  name: 'DmarcOrderField',
  description: 'Properties by which dmarc connections can be ordered.',
  values: {
    TIMESTAMP: {
      value: 'timestamp',
      description: 'Order dmarc summaries by timestamp.',
    },
    RECORD: {
      value: 'record',
      description: 'Order dmarc summaries by record.',
    },
    P_POLICY: {
      value: 'p-policy',
      description: 'Order dmarc summaries by p policy.',
    },
    SP_POLICY: {
      value: 'sp-policy',
      description: 'Order dmarc summaries by sp policy.',
    },
    PCT: {
      value: 'pct',
      description: 'Order dmarc summaries by percentage.',
    },
  },
})
