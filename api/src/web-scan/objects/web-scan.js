import {GraphQLObjectType, GraphQLString} from 'graphql'
import {globalIdField} from 'graphql-relay'

import {domainType} from '../../domain/objects'
import {nodeInterface} from "../../node";
import {tlsResultType} from "./tls-result";
import {webConnectionResultType} from "./web-connection-result";
import {GraphQLDate} from "graphql-scalars";

export const webScanType = new GraphQLObjectType({
  name: 'WebScan',
  fields: () => ({
    id: globalIdField('web'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({domainId}, _, {loaders: {loadDomainByKey}}) => {
        const domain = await loadDomainByKey.load(domainId)
        domain.id = domain._key
        return domain
      },
    },
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
  interfaces: [nodeInterface],
  description: `Results of TLS and HTTP connection scans on the given domain.`,
})
