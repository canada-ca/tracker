import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { guidanceTagType } from '../../guidance-tag/objects'

export const dkimResultSubType = new GraphQLObjectType({
  name: 'DkimResultSub',
  description: 'Individual one-off scans results for the given dkim selector.',
  fields: () => ({
    selector: {
      type: GraphQLString,
      description: 'The selector the scan was ran on.',
      resolve: ({ selector }) => selector,
    },
    record: {
      type: GraphQLString,
      description: 'DKIM record retrieved during the scan of the domain.',
      resolve: ({ record }) => record,
    },
    keyLength: {
      type: GraphQLString,
      description: 'Size of the Public Key in bits',
      resolve: ({ keyLength }) => keyLength,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    negativeGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: 'Negative guidance tags found during scan.',
      resolve: async (
        { negativeTags },
        _args,
        { loaders: { loadDkimGuidanceTagByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagByTagId.loadMany(negativeTags)
        return dkimTags
      },
    },
    neutralGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: 'Neutral guidance tags found during scan.',
      resolve: async (
        { neutralTags },
        _args,
        { loaders: { loadDkimGuidanceTagByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagByTagId.loadMany(neutralTags)
        return dkimTags
      },
    },
    positiveGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: 'Positive guidance tags found during scan.',
      resolve: async (
        { positiveTags },
        _args,
        { loaders: { loadDkimGuidanceTagByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagByTagId.loadMany(positiveTags)
        return dkimTags
      },
    },
  }),
})
