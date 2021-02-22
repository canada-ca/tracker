import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, AffiliationOrderField } from '../../enums'

export const affiliationOrder = new GraphQLInputObjectType({
  name: 'AffiliationOrder',
  description: 'Ordering options for affiliation connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(AffiliationOrderField),
      description: 'The field to order affiliations by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
