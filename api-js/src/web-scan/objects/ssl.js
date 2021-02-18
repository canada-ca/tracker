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
import { guidanceTagConnection } from '../../guidance-tag'
import { nodeInterface } from '../../node'

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
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during scan.`,
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
