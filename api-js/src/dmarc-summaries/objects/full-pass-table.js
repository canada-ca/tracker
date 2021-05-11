import { GraphQLObjectType, GraphQLString, GraphQLInt } from 'graphql'
import { globalIdField } from 'graphql-relay'

export const fullPassTableType = new GraphQLObjectType({
  name: 'FullPassTable',
  description:
    'This table contains the data fields for senders who are in the Full Pass category.',
  fields: () => ({
    id: globalIdField('fullPass'),
    dkimDomains: {
      type: GraphQLString,
      description: 'Domains used for DKIM validation',
      resolve: ({ dkimDomains }) => dkimDomains,
    },
    dkimSelectors: {
      type: GraphQLString,
      description: 'Pointer to a DKIM public key record in DNS.',
      resolve: ({ dkimSelectors }) => dkimSelectors,
    },
    dnsHost: {
      type: GraphQLString,
      description: 'Host from reverse DNS of source IP address.',
      resolve: ({ dnsHost }) => dnsHost,
    },
    envelopeFrom: {
      type: GraphQLString,
      description: 'Domain from SMTP banner message.',
      resolve: ({ envelopeFrom }) => envelopeFrom,
    },
    headerFrom: {
      type: GraphQLString,
      description: 'The address/domain used in the "From" field.',
      resolve: ({ headerFrom }) => headerFrom,
    },
    sourceIpAddress: {
      type: GraphQLString,
      description: 'IP address of sending server.',
      resolve: ({ sourceIpAddress }) => sourceIpAddress,
    },
    spfDomains: {
      type: GraphQLString,
      description: 'Domains used for SPF validation.',
      resolve: ({ spfDomains }) => spfDomains,
    },
    totalMessages: {
      type: GraphQLInt,
      description: 'Total messages from this sender.',
      resolve: ({ totalMessages }) => totalMessages,
    },
  }),
})
