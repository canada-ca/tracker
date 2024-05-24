import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, WebOrderField } from '../../enums'

export const webOrder = new GraphQLInputObjectType({
  name: 'WebOrder',
  description: 'Ordering options for web connections.',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(WebOrderField),
      description: 'The field to order web scans by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
