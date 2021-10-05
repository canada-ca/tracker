import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, HttpsOrderField } from '../../enums'

export const httpsOrder = new GraphQLInputObjectType({
  name: 'HTTPSOrder',
  description: 'Ordering options for HTTPS connections.',
  fields: {
    field: {
      type: GraphQLNonNull(HttpsOrderField),
      description: 'The field to order HTTPS edges by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  },
})
