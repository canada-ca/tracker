import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, SpfOrderField } from '../../enums'

export const spfOrder = new GraphQLInputObjectType({
  name: 'SPFOrder',
  description: 'Ordering options for SPF connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(SpfOrderField),
      description: 'The field to order SPF scans by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
