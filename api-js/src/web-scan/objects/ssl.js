import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'
import { guidanceTagOrder } from '../../guidance-tag/inputs'
import { guidanceTagConnection } from '../../guidance-tag/objects'

export const sslType = new GraphQLObjectType({
  name: 'SSL',
  fields: () => ({
    id: globalIdField('ssl'),
    acceptableCiphers: {
      type: GraphQLList(GraphQLString),
      description:
        'List of ciphers in use by the server deemed to be "acceptable".',
      resolve: ({ acceptable_ciphers: acceptableCiphers }) => acceptableCiphers,
    },
    acceptableCurves: {
      type: GraphQLList(GraphQLString),
      description:
        'List of curves in use by the server deemed to be "acceptable".',
      resolve: ({ acceptable_curves: acceptableCurves }) => acceptableCurves,
    },
    ccsInjectionVulnerable: {
      type: GraphQLBoolean,
      description: 'Denotes vulnerability to OpenSSL CCS Injection.',
      resolve: ({ ccs_injection_vulnerable: ccsInjectionVulnerable }) =>
        ccsInjectionVulnerable,
    },
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    heartbleedVulnerable: {
      type: GraphQLBoolean,
      description: 'Denotes vulnerability to "Heartbleed" exploit.',
      resolve: ({ heartbleed_vulnerable: heartbleedVulnerable }) =>
        heartbleedVulnerable,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    strongCiphers: {
      type: GraphQLList(GraphQLString),
      description:
        'List of ciphers in use by the server deemed to be "strong".',
      resolve: ({ strong_ciphers: strongCiphers }) => strongCiphers,
    },
    strongCurves: {
      type: GraphQLList(GraphQLString),
      description: 'List of curves in use by the server deemed to be "strong".',
      resolve: ({ strong_curves: strongCurves }) => strongCurves,
    },
    supportsEcdhKeyExchange: {
      type: GraphQLBoolean,
      description: 'Denotes support for elliptic curve key pairs.',
      resolve: ({ supports_ecdh_key_exchange: supportsEcdhKeyExchange }) =>
        supportsEcdhKeyExchange,
    },
    timestamp: {
      type: GraphQLString,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    weakCiphers: {
      type: GraphQLList(GraphQLString),
      description:
        'List of ciphers in use by the server deemed to be "weak" or in other words, are not compliant with security standards.',
      resolve: ({ weak_ciphers: weakCiphers }) => weakCiphers,
    },
    weakCurves: {
      type: GraphQLList(GraphQLString),
      description:
        'List of curves in use by the server deemed to be "weak" or in other words, are not compliant with security standards.',
      resolve: ({ weak_curves: weakCurves }) => weakCurves,
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      deprecationReason: 'This has been sub-divided into neutral, negative, and positive tags.',
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
        { loaders: { sslGuidanceTagConnectionsLoader } },
      ) => {
        const sslTags = await sslGuidanceTagConnectionsLoader({
          sslGuidanceTags: guidanceTags,
          ...args,
        })
        return sslTags
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
        { loaders: { sslGuidanceTagConnectionsLoader } },
      ) => {
        const sslTags = await sslGuidanceTagConnectionsLoader({
          sslGuidanceTags: negativeTags,
          ...args,
        })
        return sslTags
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
        { loaders: { sslGuidanceTagConnectionsLoader } },
      ) => {
        const sslTags = await sslGuidanceTagConnectionsLoader({
          sslGuidanceTags: neutralTags,
          ...args,
        })
        return sslTags
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
        { loaders: { sslGuidanceTagConnectionsLoader } },
      ) => {
        const sslTags = await sslGuidanceTagConnectionsLoader({
          sslGuidanceTags: positiveTags,
          ...args,
        })
        return sslTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Secure Socket Layer scan results.`,
})

export const sslConnection = connectionDefinitions({
  name: 'SSL',
  nodeType: sslType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
