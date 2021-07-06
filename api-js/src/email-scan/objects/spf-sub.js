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

export const spfSubType = new GraphQLObjectType({
  name: 'SpfSub',
  description:
    'SPF gql object containing the fields for the `dkimScanData` subscription.',
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
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: ({ lookups }) => lookups,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: ({ record }) => record,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: ({ spfDefault }) => spfDefault,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    negativeGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Negative guidance tags found during scan.`,
      resolve: async (
        { negativeTags },
        _args,
        { loaders: { loadSpfGuidanceTagByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagByTagId.loadMany(negativeTags)
        return spfTags
      },
    },
    neutralGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Neutral guidance tags found during scan.`,
      resolve: async (
        { neutralTags },
        _args,
        { loaders: { loadSpfGuidanceTagByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagByTagId.loadMany(neutralTags)
        return spfTags
      },
    },
    positiveGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Positive guidance tags found during scan.`,
      resolve: async (
        { positiveTags },
        _args,
        { loaders: { loadSpfGuidanceTagByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagByTagId.loadMany(positiveTags)
        return spfTags
      },
    },
  }),
})
