import {GraphQLObjectType, GraphQLString} from 'graphql'
import {globalIdField} from 'graphql-relay'

import {domainType} from '../../domain/objects'
import {nodeInterface} from "../../node";
import {tlsResultType} from "./tls-result";
import {webConnectionResultType} from "./web-connection-result";
import {GraphQLDate} from "graphql-scalars";
import {webScanResultType} from "./web-scan-result";

export const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: ({timestamp}) => new Date(timestamp),
    },
    ipAddress: {
      type: GraphQLString,
      description: `IP address for scan target.`,
    },
    status: {
      type: GraphQLString,
      description: `The status of the scan for the given domain and IP address.`,
    },
    results: {
      type: webScanResultType,
      description: `Results of TLS and HTTP connection scans on the given domain.`,
      resolve: async({results}) => results
    },
  }),
  description: `Information for the TLS and HTTP connection scans on the given domain.`,
})
