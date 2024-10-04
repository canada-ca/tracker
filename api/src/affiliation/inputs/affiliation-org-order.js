import { GraphQLInputObjectType, GraphQLNonNull } from 'graphql'

import { OrderDirection, AffiliationOrgOrderField } from '../../enums'

export const affiliationOrgOrder = new GraphQLInputObjectType({
  name: 'AffiliationOrgOrder',
  description: 'Ordering options for affiliation connections.',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(AffiliationOrgOrderField),
      description: 'The field to order affiliations by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
