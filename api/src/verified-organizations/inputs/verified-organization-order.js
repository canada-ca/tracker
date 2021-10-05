import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, VerifiedOrganizationOrderField } from '../../enums'

export const verifiedOrganizationOrder = new GraphQLInputObjectType({
  name: 'VerifiedOrganizationOrder',
  description: 'Ordering options for verified organization connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(VerifiedOrganizationOrderField),
      description: 'The field to order verified organizations by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
