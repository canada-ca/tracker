import {GraphQLInputObjectType, GraphQLNonNull} from 'graphql'

import {OrderDirection, DomainOrderField} from '../../enums'

export const domainOrder = new GraphQLInputObjectType({
  name: 'DomainOrder',
  description: 'Ordering options for domain connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(DomainOrderField),
      description: 'The field to order domains by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
