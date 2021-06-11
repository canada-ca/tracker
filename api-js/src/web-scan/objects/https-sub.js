import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql'
import { GraphQLJSON } from 'graphql-scalars'

import { guidanceTagType } from '../../guidance-tag/objects'

export const httpsSubType = new GraphQLObjectType({
  name: 'HttpsSub',
  description:
    'HTTPS gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
    implementation: {
      type: GraphQLString,
      description: `State of the HTTPS implementation on the server and any issues therein.`,
      resolve: ({ implementation }) => implementation,
    },
    enforced: {
      type: GraphQLString,
      description: `Degree to which HTTPS is enforced on the server based on behaviour.`,
      resolve: ({ enforced }) => enforced,
    },
    hsts: {
      type: GraphQLString,
      description: `Presence and completeness of HSTS implementation.`,
      resolve: ({ hsts }) => hsts,
    },
    hstsAge: {
      type: GraphQLString,
      description: `Denotes how long the domain should only be accessed using HTTPS`,
      resolve: ({ hstsAge }) => hstsAge,
    },
    preloaded: {
      type: GraphQLString,
      description: `Denotes whether the domain has been submitted and included within HSTS preload list.`,
      resolve: ({ preloaded }) => preloaded,
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
        { loaders: { loadHttpsGuidanceTagByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagByTagId.loadMany(
          negativeTags,
        )
        return httpsTags
      },
    },
    neutralGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Neutral guidance tags found during scan.`,
      resolve: async (
        { neutralTags },
        _args,
        { loaders: { loadHttpsGuidanceTagByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagByTagId.loadMany(
          neutralTags,
        )
        return httpsTags
      },
    },
    positiveGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Positive guidance tags found during scan.`,
      resolve: async (
        { positiveTags },
        _args,
        { loaders: { loadHttpsGuidanceTagByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagByTagId.loadMany(
          positiveTags,
        )
        return httpsTags
      },
    },
  }),
})
