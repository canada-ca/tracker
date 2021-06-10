import {
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
} from 'graphql'
import { guidanceTagType } from '../../guidance-tag/objects'

export const spfSubType = new GraphQLObjectType({
  name: 'SpfSub',
  description:
    'SPF gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
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
