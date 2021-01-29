import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { connectionDefinitions, globalIdField } from 'graphql-relay'

export const spfFailureTableType = new GraphQLObjectType({
  name: 'SpfFailureTable',
  description:
    'This table contains the data fields for senders who are in the SPF fail category.',
  fields: () => ({
    id: globalIdField('spfFail'),
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
    guidance: {
      type: GraphQLString,
      description: 'Guidance for any issues that were found from the report.',
      resolve: ({ guidance }) => guidance,
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
    spfAligned: {
      type: GraphQLBoolean,
      description: 'Is SPF aligned.',
      resolve: ({ spfAligned }) => spfAligned,
    },
    spfDomains: {
      type: GraphQLString,
      description: 'Domains used for SPF validation.',
      resolve: ({ spfDomains }) => spfDomains,
    },
    spfResults: {
      type: GraphQLString,
      description:
        'The results of DKIM verification of the message. Can be pass, fail, neutral, soft-fail, temp-error, or perm-error.',
      resolve: ({ spfResults }) => spfResults,
    },
    totalMessages: {
      type: GraphQLInt,
      description: 'Total messages from this sender.',
      resolve: ({ totalMessages }) => totalMessages,
    },
  }),
})

export const spfFailureConnection = connectionDefinitions({
  name: 'SpfFailureTable',
  nodeType: spfFailureTableType,
})
