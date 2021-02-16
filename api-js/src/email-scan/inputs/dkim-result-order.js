import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, DkimResultOrderField } from '../../enums'

export const dkimResultOrder = new GraphQLInputObjectType({
  name: 'DKIMResultOrder',
  description: 'Ordering options for DKIM Result connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(DkimResultOrderField),
      description: 'The field to order DKIM Results by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
