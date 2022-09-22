import {GraphQLInputObjectType, GraphQLNonNull} from 'graphql'

import {OrderDirection, WebOrderField} from '../../enums'

export const webOrder = new GraphQLInputObjectType({
  name: 'WebOrder',
  description: 'Ordering options for web connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(WebOrderField),
      description: 'The field to order web scans by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
