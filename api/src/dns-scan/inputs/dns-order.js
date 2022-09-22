import {GraphQLInputObjectType, GraphQLNonNull} from 'graphql'

import {OrderDirection, DnsOrderField} from '../../enums'

export const dnsOrder = new GraphQLInputObjectType({
  name: 'DNSOrder',
  description: 'Ordering options for DNS connections.',
  fields: () => ({
    field: {
      type: GraphQLNonNull(DnsOrderField),
      description: 'The field to order DNS scans by.',
    },
    direction: {
      type: GraphQLNonNull(OrderDirection),
      description: 'The ordering direction.',
    },
  }),
})
