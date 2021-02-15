import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, DkimOrderField } from '../../enums'

export const dkimOrder = new GraphQLInputObjectType({
  name: 'DKIMOrder',
  description: 'Ordering options for DKIM connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(DkimOrderField),
      description: 'The field to order DKIM scans by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
