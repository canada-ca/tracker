import { GraphQLBoolean, GraphQLObjectType, GraphQLString } from 'graphql'

import { webScanResultType } from './web-scan-result'

export const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    ipAddress: {
      type: GraphQLString,
      description: `IP address for scan target.`,
    },
    status: {
      type: GraphQLString,
      description: `The status of the scan for the given domain and IP address.`,
    },
    isPrivateIp: {
      type: GraphQLBoolean,
      description: `Whether the IP address is a private IP address.`,
    },
    results: {
      type: webScanResultType,
      description: `Results of TLS and HTTP connection scans on the given domain.`,
      resolve: async ({ results }) => results,
    },
  }),
  description: `Information for the TLS and HTTP connection scans on the given domain.`,
})
