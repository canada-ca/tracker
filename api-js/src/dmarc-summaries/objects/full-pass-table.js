import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
} from 'graphql'
import { globalIdField } from 'graphql-relay'

import { Domain } from '../../scalars'

export const fullPassTableType = new GraphQLObjectType({
  name: 'FullPassTable',
  description:
    'This table contains the data fields for senders who are in the Full Pass category.',
  fields: () => ({
    id: globalIdField('fullPass'),
    dkimDomains: {
      type: GraphQLList(Domain),
      description: 'Domains used for DKIM validation',
      resolve: ({ dkimDomains }) => dkimDomains.split(','),
    },
    dkimSelectors: {
      type: GraphQLList(Domain),
      description: 'Pointer to a DKIM public key record in DNS.',
      resolve: ({ dkimSelectors }) => dkimSelectors.split(','),
    },
    dnsHost: {
      type: Domain,
      description: 'Host from reverse DNS of source IP address.',
      resolve: ({ dnsHost }) => dnsHost,
    },
    envelopeFrom: {
      type: Domain,
      description: 'Domain from SMTP banner message.',
      resolve: ({ envelopeFrom }) => envelopeFrom,
    },
    headerFrom: {
      type: Domain,
      description: 'The address/domain used in the "From" field.',
      resolve: ({ headerFrom }) => headerFrom,
    },
    sourceIpAddress: {
      type: GraphQLString,
      description: 'IP address of sending server.',
      resolve: ({ sourceIpAddress }) => sourceIpAddress,
    },
    spfDomains: {
      type: GraphQLList(Domain),
      description: 'Domains used for SPF validation.',
      resolve: ({ spfDomains }) => spfDomains.split(','),
    },
    totalMessages: {
      type: GraphQLInt,
      description: 'Total messages from this sender.',
      resolve: ({ totalMessages }) => totalMessages,
    },
  }),
})
