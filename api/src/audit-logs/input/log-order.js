import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'
import { OrderDirection, LogOrderField } from '../../enums'

export const logOrder = new GraphQLInputObjectType({
  name: 'LogOrder',
  description: 'Ordering options for audit logs.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(LogOrderField),
      description: 'The field to order logs by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
