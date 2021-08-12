import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { globalIdField } from 'graphql-relay'

import { guidanceTagType } from '../../guidance-tag/objects'

export const dkimFailureTableType = new GraphQLObjectType({
  name: 'DkimFailureTable',
  description:
    'This table contains the data fields for senders who are in the DKIM fail category.',
  fields: () => ({
    id: globalIdField('dkimFail'),
    dkimAligned: {
      type: GraphQLBoolean,
      description: 'Is DKIM aligned.',
      resolve: ({ dkimAligned }) => dkimAligned,
    },
    dkimDomains: {
      type: GraphQLString,
      description: 'Domains used for DKIM validation',
      resolve: ({ dkimDomains }) => dkimDomains,
    },
    dkimResults: {
      type: GraphQLString,
      description:
        'The results of DKIM verification of the message. Can be pass, fail, neutral, temp-error, or perm-error.',
      resolve: ({ dkimResults }) => dkimResults,
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
        { loaders: { loadAggregateGuidanceTagByTagId } },
      ) => {
        if (guidance) {
          return await loadAggregateGuidanceTagByTagId.load(guidance)
        }
        return {}
      },
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
    totalMessages: {
      type: GraphQLInt,
      description: 'Total messages from this sender.',
      resolve: ({ totalMessages }) => totalMessages,
    },
  }),
})
