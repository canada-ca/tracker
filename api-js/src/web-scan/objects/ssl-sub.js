import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql'
import { guidanceTagType } from '../../guidance-tag/objects'

export const sslSubType = new GraphQLObjectType({
  name: 'SslSub',
  description:
    'SSL gql object containing the fields for the `dkimScanData` subscription.',
  fields: () => ({
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
    heartbleedVulnerable: {
      type: GraphQLBoolean,
      description: 'Denotes vulnerability to "Heartbleed" exploit.',
      resolve: ({ heartbleed_vulnerable: heartbleedVulnerable }) =>
        heartbleedVulnerable,
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
    negativeGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Negative guidance tags found during scan.`,
      resolve: async (
        { negativeTags },
        _args,
        { loaders: { loadSslGuidanceTagByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagByTagId.loadMany(negativeTags)
        return sslTags
      },
    },
    neutralGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Neutral guidance tags found during scan.`,
      resolve: async (
        { neutralTags },
        _args,
        { loaders: { loadSslGuidanceTagByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagByTagId.loadMany(neutralTags)
        return sslTags
      },
    },
    positiveGuidanceTags: {
      type: GraphQLList(guidanceTagType),
      description: `Positive guidance tags found during scan.`,
      resolve: async (
        { positiveTags },
        _args,
        { loaders: { loadSslGuidanceTagByTagId } },
      ) => {
        const sslTags = await loadSslGuidanceTagByTagId.loadMany(positiveTags)
        return sslTags
      },
    },
  }),
})
