import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, VerifiedDomainOrderField } from '../../enums'

export const verifiedDomainOrder = new GraphQLInputObjectType({
  name: 'VerifiedDomainOrder',
  description: 'Ordering options for verified domain connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(VerifiedDomainOrderField),
      description: 'The field to order verified domains by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
