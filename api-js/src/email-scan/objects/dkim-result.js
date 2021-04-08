import { GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { dkimType } from './dkim'
import { nodeInterface } from '../../node'
import { guidanceTagOrder } from '../../guidance-tag/inputs'
import { guidanceTagConnection } from '../../guidance-tag/objects'

export const dkimResultType = new GraphQLObjectType({
  name: 'DKIMResult',
  fields: () => ({
    id: globalIdField('dkimResult'),
    dkim: {
      type: dkimType,
      description: 'The DKIM scan information that this result belongs to.',
      resolve: async ({ dkimId }, _, { loaders: { loadDkimByKey } }) => {
        const dkimKey = dkimId.split('/')[1]
        const dkim = await loadDkimByKey.load(dkimKey)
        dkim.id = dkim._key
        return dkim
      },
    },
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
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      deprecationReason:
        'This has been sub-divided into neutral, negative, and positive tags.',
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: 'Guidance tags found during scan.',
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { loadDkimGuidanceTagConnectionsByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagConnectionsByTagId({
          dkimGuidanceTags: guidanceTags,
          ...args,
        })
        return dkimTags
      },
    },
    negativeGuidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: 'Negative guidance tags found during scan.',
      resolve: async (
        { negativeTags },
        args,
        { loaders: { loadDkimGuidanceTagConnectionsByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagConnectionsByTagId({
          dkimGuidanceTags: negativeTags,
          ...args,
        })
        return dkimTags
      },
    },
    neutralGuidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: 'Neutral guidance tags found during scan.',
      resolve: async (
        { neutralTags },
        args,
        { loaders: { loadDkimGuidanceTagConnectionsByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagConnectionsByTagId({
          dkimGuidanceTags: neutralTags,
          ...args,
        })
        return dkimTags
      },
    },
    positiveGuidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: 'Positive guidance tags found during scan.',
      resolve: async (
        { positiveTags },
        args,
        { loaders: { loadDkimGuidanceTagConnectionsByTagId } },
      ) => {
        const dkimTags = await loadDkimGuidanceTagConnectionsByTagId({
          dkimGuidanceTags: positiveTags,
          ...args,
        })
        return dkimTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: 'Individual scans results for the given DKIM selector.',
})
