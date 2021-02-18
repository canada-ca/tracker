import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, SslOrderField } from '../../enums'

export const sslOrder = new GraphQLInputObjectType({
  name: 'SSLOrder',
  description: 'Ordering options for SSL connections.',
  fields: {
    field: {
      type: GraphQLNonNull(SslOrderField),
      description: 'The field to order SSL edges by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  },
})
