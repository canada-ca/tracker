import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLID,
} from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { guidanceTagType } from '../../guidance-tag/objects'

export const dmarcSubType = new GraphQLObjectType({
  name: 'DmarcSub',
  description:
    'DMARC gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    sharedId: {
      type: GraphQLID,
      description: `The shared id to match scans together.`,
      resolve: ({ sharedId }) => sharedId,
    },
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainKey }, _, { loaders: { loadDomainByKey } }) => {
        const domain = await loadDomainByKey.load(domainKey)
        return domain
      },
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: ({ record }) => record,
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
when your email fails DMARC authentication and alignment checks. `,
      resolve: ({ pPolicy }) => pPolicy,
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: ({ spPolicy }) => spPolicy,
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: ({ pct }) => pct,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    negativeGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Negative guidance tags found during DMARC Scan.`,
      resolve: async (
        { negativeTags },
        _args,
        { loaders: { loadDmarcGuidanceTagByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagByTagId.loadMany(
          negativeTags,
        )
        return dmarcTags
      },
    },
    neutralGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Neutral guidance tags found during DMARC Scan.`,
      resolve: async (
        { neutralTags },
        _args,
        { loaders: { loadDmarcGuidanceTagByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagByTagId.loadMany(
          neutralTags,
        )
        return dmarcTags
      },
    },
    positiveGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Positive guidance tags found during DMARC Scan.`,
      resolve: async (
        { positiveTags },
        _args,
        { loaders: { loadDmarcGuidanceTagByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagByTagId.loadMany(
          positiveTags,
        )
        return dmarcTags
      },
    },
  }),
})
