import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, DmarcOrderField } from '../../enums'

export const dmarcOrder = new GraphQLInputObjectType({
  name: 'DMARCOrder',
  description: 'Ordering options for DMARC connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(DmarcOrderField),
      description: 'The field to order DMARC scans by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
