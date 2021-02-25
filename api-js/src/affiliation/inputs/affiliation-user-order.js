import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, AffiliationUserOrderField } from '../../enums'

export const affiliationUserOrder = new GraphQLInputObjectType({
  name: 'AffiliationUserOrder',
  description: 'Ordering options for affiliation connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(AffiliationUserOrderField),
      description: 'The field to order affiliations by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
