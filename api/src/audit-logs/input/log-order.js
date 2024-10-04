import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'
import { OrderDirection, LogOrderField } from '../../enums'

export const logOrder = new GraphQLInputObjectType({
  name: 'LogOrder',
  description: 'Ordering options for audit logs.',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(LogOrderField),
      description: 'The field to order logs by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
