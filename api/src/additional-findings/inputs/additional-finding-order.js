import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, AdditionalFindingOrderField } from '../../enums'

export const additionalFindingOrder = new GraphQLInputObjectType({
  name: 'AdditionalFindingOrder',
  description: 'Ordering options for additional finding connections. Defaults to last seen, descending.',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(AdditionalFindingOrderField),
      description: 'The field to order additional findings by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
