import {
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { globalIdField } from 'graphql-relay'

import { Domain } from '../../scalars'

export const dmarcFailureTableType = new GraphQLObjectType({
  name: 'DmarcFailureTable',
  description:
    'This table contains the data fields for senders who are in the DMARC failure category.',
  fields: () => ({
    id: globalIdField('dmarcFail'),
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
    disposition: {
      type: GraphQLString,
      description:
        'The DMARC enforcement action that the receiver took, either none, quarantine, or reject.',
      resolve: ({ disposition }) => disposition,
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
