import {GraphQLBoolean, GraphQLObjectType, GraphQLString} from 'graphql'
import { GraphQLJSONObject} from 'graphql-scalars'


export const webConnectionResultType = new GraphQLObjectType({
  name: 'WebConnectionResult',
  fields: () => ({
    hstsStatus: {
      type: GraphQLString,
      description: `The compliance status for HSTS for the scanned server from this scan.`,
      resolve: async ({hstsStatus}) => hstsStatus
    },
    httpsStatus: {
      type: GraphQLString,
      description: `The compliance status for HTTPS for the scanned server from this scan.`,
      resolve: async ({httpsStatus}) => httpsStatus
    },
    httpLive: {
      type: GraphQLBoolean,
      description: `Whether or not the server is serving data over HTTP.`,
      resolve: async ({httpLive}) => httpLive
    },
    httpsLive: {
      type: GraphQLBoolean,
      description: `Whether or not the server is serving data over HTTPS`,
      resolve: async ({httpsLive}) => httpsLive
    },
    httpsKeepsHttps: {
      type: GraphQLBoolean,
      description: `Whether or not HTTPS connection is ever downgraded (after redirect for example).`,
      resolve: async ({httpsKeepsHttps}) => httpsKeepsHttps
    },
    httpUpgrades: {
      type: GraphQLBoolean,
      description: `The compliance status for HSTS for the scanned server from this scan.`,
      resolve: async ({httpUpgrades}) => httpUpgrades
    },
    hstsParsed: {
      type: GraphQLJSONObject,
      description: `The parsed values for the HSTS header.`,
      resolve: async ({hstsParsed}) => hstsParsed
    },
    ipAddress: {
      type: GraphQLString,
      description: `The IP address for the scanned server.`,
      resolve: async ({ipAddress}) => ipAddress
    },
    httpChainResult: {
      type: GraphQLJSONObject,
      description: `The chain of connections created when visiting the domain using HTTP.`,
      resolve: async ({httpChainResult}) => httpChainResult
    },
    httpsChainResult: {
      type: GraphQLJSONObject,
      description: `The chain of connections created when visiting the domain using HTTPS.`,
      resolve: async ({httpsChainResult}) => httpsChainResult
    },
  }),
  description: `Results of HTTP connection scan on the given domain.`,
})
