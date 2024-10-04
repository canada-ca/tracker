import { GraphQLNonNull, GraphQLInputObjectType } from 'graphql'

import { OrderDirection, DmarcSummaryOrderField } from '../../enums'

export const dmarcSummaryOrder = new GraphQLInputObjectType({
  name: 'DmarcSummaryOrder',
  description: 'Ordering options for dmarc summary connections.',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(DmarcSummaryOrderField),
      description: 'The field to order dmarc summaries by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
