import {GraphQLObjectType, GraphQLString} from 'graphql'
import {globalIdField} from 'graphql-relay'

import {domainType} from '../../domain/objects'
import {nodeInterface} from "../../node";
import {tlsResultType} from "./tls-result";
import {webConnectionResultType} from "./web-connection-result";
import {GraphQLDate} from "graphql-scalars";

export const webScanResultType = new GraphQLObjectType({
  name: 'WebScanResult',
  fields: () => ({
    timestamp: {
      type: GraphQLDate,
      description: `The time when the scan was initiated.`,
      resolve: ({timestamp}) => new Date(timestamp),
    },
    tlsResult: {
      type: tlsResultType,
      description: `The result for the TLS scan for the scanned server.`,
      resolve: async({tlsResult}) => tlsResult
    },
    connectionResults: {
      type: webConnectionResultType,
      description: `The result for the HTTP connection scan for the scanned server.`,
      resolve: async({connectionResults}) => connectionResults
    }
  }),
  description: `Results of TLS and HTTP connection scans on the given domain.`,
})
