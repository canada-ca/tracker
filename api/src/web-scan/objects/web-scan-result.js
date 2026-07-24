import { GraphQLObjectType } from 'graphql'

import { tlsResultType } from './tls-result'
import { webConnectionResultType } from './web-connection-result'
import { experimentalResultType } from './experimental-result'
import { GraphQLDateTime } from 'graphql-scalars'

export const webScanResultType = new GraphQLObjectType({
  name: 'WebScanResult',
  fields: () => ({
    timestamp: {
      type: GraphQLDateTime,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    tlsResult: {
      type: tlsResultType,
      description: `The result for the TLS scan for the scanned server.`,
      resolve: async ({ tlsResult }) => tlsResult,
    },
    connectionResults: {
      type: webConnectionResultType,
      description: `The result for the HTTP connection scan for the scanned server.`,
      resolve: async ({ connectionResults }) => connectionResults,
    },
    experimental: {
      type: experimentalResultType,
      description: `Results of experimental scans, visible to super admins only. Not a supported part of the API.`,
      resolve: async ({ experimental }, __, { auth: { checkSuperAdmin } }) => {
        const isSuperAdmin = await checkSuperAdmin()
        if (isSuperAdmin) return experimental
        return null
      },
    },
  }),
  description: `Results of TLS and HTTP connection scans on the given domain.`,
})
