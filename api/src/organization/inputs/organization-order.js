import { GraphQLNonNull, GraphQLInputObjectType } from 'graphql'

import { OrderDirection, OrganizationOrderField } from '../../enums'

export const organizationOrder = new GraphQLInputObjectType({
  name: 'OrganizationOrder',
  description: 'Ordering options for organization connections',
  fields: () => ({
    field: {
      type: new GraphQLNonNull(OrganizationOrderField),
      description: 'The field to order organizations by.',
    },
    direction: {
      type: new GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
