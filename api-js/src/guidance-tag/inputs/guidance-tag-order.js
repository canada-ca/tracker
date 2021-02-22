import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, GuidanceTagOrderField } from '../../enums'

export const guidanceTagOrder = new GraphQLInputObjectType({
  name: 'GuidanceTagOrder',
  description: 'Ordering options for guidance tag connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(GuidanceTagOrderField),
      description: 'The field to order guidance tags by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
