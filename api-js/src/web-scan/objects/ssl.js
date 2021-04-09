import {
  GraphQLBoolean,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

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
      resolve: async ({ domainId }, _, { loaders: { loadDomainByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await loadDomainByKey.load(domainKey)
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
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
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
        { loaders: { loadSslGuidanceTagConnectionsByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagConnectionsByTagId({
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
        { loaders: { loadSslGuidanceTagConnectionsByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagConnectionsByTagId({
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
        { loaders: { loadSslGuidanceTagConnectionsByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagConnectionsByTagId({
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
        { loaders: { loadSslGuidanceTagConnectionsByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagConnectionsByTagId({
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
