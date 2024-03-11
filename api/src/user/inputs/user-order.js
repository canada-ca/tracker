import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, UserOrderField } from '../../enums'

export const userOrder = new GraphQLInputObjectType({
  name: 'UserOrder',
  description: 'Ordering options for affiliation connections.',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(UserOrderField),
      description: 'The field to order affiliations by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
