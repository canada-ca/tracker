import { GraphQLNonNull, GraphQLInputObjectType } from 'graphql'

import { OrderDirection, OrganizationOrderField } from '../../enums'

export const organizationOrder = new GraphQLInputObjectType({
  name: 'OrganizationOrder',
  description: 'Ordering options for organization connections',
  fields: () => ({
    field: {
      type: GraphQLNonNull(OrganizationOrderField),
      description: 'The field to order organizations by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
