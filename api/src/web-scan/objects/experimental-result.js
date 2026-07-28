import { GraphQLBoolean, GraphQLFloat, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'

export const pqcBuildRefsType = new GraphQLObjectType({
  name: 'PqcBuildRefs',
  fields: () => ({
    nasslCommit: {
      type: GraphQLString,
      description: `The nassl commit the experimental environment was built from.`,
      resolve: async ({ nasslCommit }) => nasslCommit,
    },
    sslyzeCommit: {
      type: GraphQLString,
      description: `The sslyze commit the experimental environment was built from.`,
      resolve: async ({ sslyzeCommit }) => sslyzeCommit,
    },
  }),
  description: `The upstream commits that produced a given experimental scan result. Version numbers are not usable here: the unreleased sslyze build reports the same version as the released one.`,
})

export const pqcResultType = new GraphQLObjectType({
  name: 'PqcResult',
  fields: () => ({
    supportsPqKeyExchange: {
      type: GraphQLBoolean,
      description: `Whether the scanned server accepted at least one post-quantum hybrid key exchange group.`,
      resolve: async ({ supportsPqKeyExchange }) => supportsPqKeyExchange,
    },
    supportedPqGroups: {
      type: new GraphQLList(GraphQLString),
      description: `The post-quantum hybrid key exchange groups accepted by the scanned server. Null when the server does not support TLS 1.3, in which case nothing was tested.`,
      resolve: async ({ supportedPqGroups }) => supportedPqGroups,
    },
    tls13Supported: {
      type: GraphQLBoolean,
      description: `Whether the scanned server supports TLS 1.3, which is a prerequisite for post-quantum key exchange.`,
      resolve: async ({ tls1_3Supported }) => tls1_3Supported,
    },
    scanStatus: {
      type: GraphQLString,
      description: `Whether sslyze was able to complete the scan.`,
      resolve: async ({ scanStatus }) => scanStatus,
    },
    status: {
      type: GraphQLString,
      description: `Whether the post-quantum scan command itself completed.`,
      resolve: async ({ status }) => status,
    },
    error: {
      type: GraphQLString,
      description: `The error encountered during the scan, if any.`,
      resolve: async ({ error }) => error,
    },
    errorReason: {
      type: GraphQLString,
      description: `The category of error reported by sslyze, if any.`,
      resolve: async ({ errorReason }) => errorReason,
    },
    durationSeconds: {
      type: GraphQLFloat,
      description: `How long the post-quantum scan took, in seconds.`,
      resolve: async ({ durationSeconds }) => durationSeconds,
    },
    schemaVersion: {
      type: GraphQLInt,
      description: `The version of the stored result shape.`,
      resolve: async ({ schemaVersion }) => schemaVersion,
    },
    buildRefs: {
      type: pqcBuildRefsType,
      description: `The upstream commits that produced this result.`,
      resolve: async ({ buildRefs }) => buildRefs,
    },
  }),
  description: `Post-quantum/hybrid TLS 1.3 key exchange support, produced by an unreleased build of sslyze. Proof of concept: these values do not feed compliance scoring and the shape may change or be removed.`,
})

export const experimentalResultType = new GraphQLObjectType({
  name: 'ExperimentalResult',
  fields: () => ({
    pqc: {
      type: pqcResultType,
      description: `The result of the post-quantum key exchange scan.`,
      resolve: async ({ pqc }) => pqc,
    },
  }),
  description: `Results of experimental scans. Nothing in here is a supported part of the API: fields may change or disappear without notice, and are only visible to super admins.`,
})
