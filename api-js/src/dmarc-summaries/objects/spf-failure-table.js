import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { globalIdField } from 'graphql-relay'

import { guidanceTagType } from '../../guidance-tag/objects'

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
      deprecationReason:
        'This has been turned into the `guidanceTag` field providing detailed information to act upon if a given tag is present.',
    },
    guidanceTag: {
      type: guidanceTagType,
      description: 'Guidance for any issues that were found from the report.',
      resolve: async (
        { guidance },
        _args,
        { loaders: { loadAggregateGuidanceTagById } },
      ) => await loadAggregateGuidanceTagById.load(guidance),
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
