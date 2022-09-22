import {GraphQLBoolean, GraphQLList, GraphQLObjectType, GraphQLString} from 'graphql'
import {GraphQLJSONObject} from 'graphql-scalars'
import {guidanceTagType} from "../../guidance-tag";


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
    httpsDowngrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTPS connection is immediately downgraded to HTTP.`,
      resolve: async ({httpsDowngrades}) => httpsDowngrades
    },
    httpImmediatelyUpgrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTP connection was immediately upgraded (redirected) to HTTPS.`,
      resolve: async ({httpImmediatelyUpgrades}) => httpImmediatelyUpgrades
    },
    httpEventuallyUpgrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTP connection was eventually upgraded (after first redirect) to HTTPS.`,
      resolve: async ({httpEventuallyUpgrades}) => httpEventuallyUpgrades
    },
    httpsEventuallyDowngrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTPS connection is eventually downgraded to HTTP.`,
      resolve: async ({httpsEventuallyDowngrades}) => httpsEventuallyDowngrades
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
    positiveTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned server from this scan.`,
      resolve: async ({positiveTags}, _, {loaders: {loadHttpsGuidanceTagByTagId}}) => {
        return await loadHttpsGuidanceTagByTagId({tags: positiveTags})
      }
    },
    neutralTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned server from this scan.`,
      resolve: async ({neutralTags}, _, {loaders: {loadHttpsGuidanceTagByTagId}}) => {
        return await loadHttpsGuidanceTagByTagId({tags: neutralTags})
      }
    },
    negativeTags: {
      type: GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned server from this scan.`,
      resolve: async ({negativeTags}, _, {loaders: {loadHttpsGuidanceTagByTagId}}) => {
        return await loadHttpsGuidanceTagByTagId({tags: negativeTags})
      }
    },
  }),
  description: `Results of HTTP connection scan on the given domain.`,
})
