import {GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {globalIdField} from 'graphql-relay'
import {GraphQLDate, GraphQLJSONObject} from 'graphql-scalars'

import {domainType} from '../../domain/objects'
import {nodeInterface} from "../../node";

export const tlsResultType = new GraphQLObjectType({
  name: 'TLSResult',
  fields: () => ({
    ipAddress: {
      type: GraphQLString,
      description: `The IP address of the domain scanned.`,
      resolve: async ({ipAddress}) => ipAddress
    },
    serverLocation: {
      type: GraphQLJSONObject,
      description: `Information regarding the server which was scanned.`,
      resolve: async ({serverLocation}) => serverLocation
    },
    certificateChainInfo: {
      type: GraphQLJSONObject,
      description: `Information for the TLS certificate retrieved from the scanned server.`,
      resolve: async ({certificateChainInfo}) => certificateChainInfo
    },
    supportsEcdhKeyExchange: {
      type: GraphQLBoolean,
      description: `Whether or not the scanned server supports ECDH key exchange.`,
      resolve: async ({supportsEcdhKeyExchange}) => supportsEcdhKeyExchange
    },
    heartbleedVulnerable: {
      type: GraphQLBoolean,
      description: `Whether or not the scanned server is vulnerable to heartbleed.`,
      resolve: async ({heartbleedVulnerable}) => heartbleedVulnerable
    },
    ccsInjectionVulnerable: {
      type: GraphQLBoolean,
      description: `Whether or not the scanned server is vulnerable to CCS injection.`,
      resolve: async ({ccsInjectionVulnerable}) => ccsInjectionVulnerable
    },
    acceptedCipherSuites: {
      type: GraphQLJSONObject,
      description: `An object containing the various TLS protocols and which suites are enabled for each protocol.`,
      resolve: async ({acceptedCipherSuites}) => acceptedCipherSuites
    },
    acceptedEllipticCurves: {
      type: GraphQLList(GraphQLJSONObject),
      description: `List of the scanned servers accepted elliptic curves and their strength.`,
      resolve: async ({acceptedEllipticCurves}) => acceptedEllipticCurves
    },
    positiveTags: {
      type: GraphQLList(GraphQLString),
      description: `List of positive tags for the scanned server from this scan.`,
      resolve: async ({positiveTags}) => positiveTags
    },
    neutralTags: {
      type: GraphQLList(GraphQLString),
      description: `List of neutral tags for the scanned server from this scan.`,
      resolve: async ({neutralTags}) => neutralTags
    },
    negativeTags: {
      type: GraphQLList(GraphQLString),
      description: `List of negative tags for the scanned server from this scan.`,
      resolve: async ({negativeTags}) => negativeTags
    },
    sslStatus: {
      type: GraphQLString,
      description: `The compliance status for TLS for the scanned server from this scan.`,
      resolve: async ({sslStatus}) => sslStatus
    },
    protocolStatus: {
      type: GraphQLString,
      description: `The compliance status for TLS protocol for the scanned server from this scan.`,
      resolve: async ({protocolStatus}) => protocolStatus
    },
    cipherStatus: {
      type: GraphQLString,
      description: `The compliance status for cipher suites for the scanned server from this scan.`,
      resolve: async ({cipherStatus}) => cipherStatus
    },
    curveStatus: {
      type: GraphQLString,
      description: `The compliance status for ECDH curves for the scanned server from this scan.`,
      resolve: async ({curveStatus}) => curveStatus
    },
  }),
  description: `Results of TLS scans on the given domain.`,
})
