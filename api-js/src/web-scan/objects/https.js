import { GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLDate, GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'
import { guidanceTagOrder } from '../../guidance-tag/inputs'
import { guidanceTagConnection } from '../../guidance-tag/objects'

export const httpsType = new GraphQLObjectType({
  name: 'HTTPS',
  fields: () => ({
    id: globalIdField('https'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { loadDomainByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await loadDomainByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
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
      description: `Guidance tags found during scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { loadHttpsGuidanceTagConnectionsByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagConnectionsByTagId({
          httpsGuidanceTags: guidanceTags,
          ...args,
        })
        return httpsTags
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
      description: `Negative guidance tags found during scan.`,
      resolve: async (
        { negativeTags },
        args,
        { loaders: { loadHttpsGuidanceTagConnectionsByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagConnectionsByTagId({
          httpsGuidanceTags: negativeTags,
          ...args,
        })
        return httpsTags
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
      description: `Neutral guidance tags found during scan.`,
      resolve: async (
        { neutralTags },
        args,
        { loaders: { loadHttpsGuidanceTagConnectionsByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagConnectionsByTagId({
          httpsGuidanceTags: neutralTags,
          ...args,
        })
        return httpsTags
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
      description: `Positive guidance tags found during scan.`,
      resolve: async (
        { positiveTags },
        args,
        { loaders: { loadHttpsGuidanceTagConnectionsByTagId } },
      ) => {
        const httpsTags = await loadHttpsGuidanceTagConnectionsByTagId({
          httpsGuidanceTags: positiveTags,
          ...args,
        })
        return httpsTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Hyper Text Transfer Protocol Secure scan results.`,
})
