import { GraphQLBoolean, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql'
import { GraphQLJSONObject } from 'graphql-scalars'
import { guidanceTagType } from '../../guidance-tag'

export const webConnectionResultType = new GraphQLObjectType({
  name: 'WebConnectionResult',
  fields: () => ({
    hstsStatus: {
      type: GraphQLString,
      description: `The compliance status for HSTS for the scanned server from this scan.`,
      resolve: async ({ hstsStatus }) => hstsStatus,
    },
    httpsStatus: {
      type: GraphQLString,
      description: `The compliance status for HTTPS for the scanned server from this scan.`,
      resolve: async ({ httpsStatus }) => httpsStatus,
    },
    httpLive: {
      type: GraphQLBoolean,
      description: `Whether or not the server is serving data over HTTP.`,
      resolve: async ({ httpLive }) => httpLive,
    },
    httpsLive: {
      type: GraphQLBoolean,
      description: `Whether or not the server is serving data over HTTPS`,
      resolve: async ({ httpsLive }) => httpsLive,
    },
    httpImmediatelyUpgrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTP connection was immediately upgraded (redirected) to HTTPS.`,
      resolve: async ({ httpImmediatelyUpgrades }) => httpImmediatelyUpgrades,
    },
    httpEventuallyUpgrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTP connection was eventually upgraded to HTTPS.`,
      resolve: async ({ httpEventuallyUpgrades }) => httpEventuallyUpgrades,
    },
    httpsImmediatelyDowngrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTPS connection is immediately downgraded to HTTP.`,
      resolve: async ({ httpsImmediatelyDowngrades }) => httpsImmediatelyDowngrades,
    },
    httpsEventuallyDowngrades: {
      type: GraphQLBoolean,
      description: `Whether or not HTTPS connection is eventually downgraded to HTTP.`,
      resolve: async ({ httpsEventuallyDowngrades }) => httpsEventuallyDowngrades,
    },
    hstsParsed: {
      type: hstsParsedType,
      description: `The parsed values for the HSTS header.`,
      resolve: async ({ hstsParsed }) => hstsParsed,
    },
    ipAddress: {
      type: GraphQLString,
      description: `The IP address for the scanned server.`,
      resolve: async ({ ipAddress }) => ipAddress,
    },
    httpChainResult: {
      type: connectionChainResultType,
      description: `The chain of connections created when visiting the domain using HTTP.`,
      resolve: async ({ httpChainResult }) => httpChainResult,
    },
    httpsChainResult: {
      type: connectionChainResultType,
      description: `The chain of connections created when visiting the domain using HTTPS.`,
      resolve: async ({ httpsChainResult }) => httpsChainResult,
    },
    positiveTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of positive tags for the scanned server from this scan.`,
      resolve: async ({ positiveTags }, _, { loaders: { loadGuidanceTagByTagId } }) => {
        return await loadGuidanceTagByTagId({ tags: positiveTags })
      },
    },
    neutralTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of neutral tags for the scanned server from this scan.`,
      resolve: async ({ neutralTags }, _, { loaders: { loadGuidanceTagByTagId } }) => {
        return await loadGuidanceTagByTagId({ tags: neutralTags })
      },
    },
    negativeTags: {
      type: new GraphQLList(guidanceTagType),
      description: `List of negative tags for the scanned server from this scan.`,
      resolve: async ({ negativeTags }, _, { loaders: { loadGuidanceTagByTagId } }) => {
        return await loadGuidanceTagByTagId({ tags: negativeTags })
      },
    },
  }),
  description: `Results of HTTP connection scan on the given domain.`,
})

export const hstsParsedType = new GraphQLObjectType({
  name: `HSTSParsed`,
  description: `The parsed values of the HSTS header.`,
  fields: () => ({
    maxAge: {
      type: GraphQLInt,
      description: `How long to trust the HSTS header.`,
    },
    includeSubdomains: {
      type: GraphQLBoolean,
      description: `Whether or not this HSTS policy should apply to subdomains.`,
    },
    preload: {
      type: GraphQLBoolean,
      description: `Whether or not the HSTS header includes the 'preload' option.`,
    },
  }),
})

export const connectionInfo = new GraphQLObjectType({
  name: `ConnectionInfo`,
  description: `Detailed info for a given connection.`,
  fields: () => ({
    statusCode: {
      type: GraphQLInt,
      description: `The HTTP response status code.`,
    },
    redirectTo: {
      type: GraphQLString,
      description: `The redirect location from the HTTP response.`,
    },
    headers: {
      type: GraphQLJSONObject,
      description: `The response headers from the HTTP response. The keys of the response are the header keys.`,
    },
    blockedCategory: {
      type: GraphQLString,
      description: `The detected category for the domain if blocked by firewall.`,
    },
    HSTS: {
      type: GraphQLBoolean,
      description: `Whether or not the response included an HSTS header.`,
    },
  }),
})

export const connectionType = new GraphQLObjectType({
  name: `Connection`,
  description: `An HTTP (or HTTPS) connection.`,
  fields: () => ({
    uri: {
      type: GraphQLString,
      description: `The URI for the given connection.`,
    },
    connection: {
      type: connectionInfo,
      description: `Detailed information for a given connection.`,
    },
    error: {
      type: GraphQLString,
      description: `Any errors which occurred when attempting to create this connection.`,
    },
    scheme: {
      type: GraphQLString,
      description: `The connection protocol used for this connection (HTTP or HTTPS).`,
    },
  }),
})

export const connectionChainResultType = new GraphQLObjectType({
  name: `ConnectionChainResult`,
  description: `Information collected while checking HTTP connections while following redirects.`,
  fields: () => ({
    scheme: {
      type: GraphQLString,
      description: `The connection protocol used for the initial connection to the server (HTTP or HTTPS).`,
    },
    domain: {
      type: GraphQLString,
      description: `The domain the scan was run on.`,
    },
    uri: {
      type: GraphQLString,
      description: `The initial full connection URI.`,
    },
    hasRedirectLoop: {
      type: GraphQLBoolean,
      description: `Whether or not a redirection loop is created (causing endless redirects).`,
    },
    connections: {
      type: new GraphQLList(connectionType),
      description: `The connection chain created when following redirects.`,
    },
    securityTxt: {
      type: new GraphQLList(securityTxtResultType),
      description: 'Result of fetching and parsing the security.txt file for this domain.',
    },
  }),
})

export const securityTxtResultType = new GraphQLObjectType({
  name: 'SecurityTxtResult',
  description: 'Represents the result of a security.txt file fetch and parse operation.',
  fields: () => ({
    path: {
      type: GraphQLString,
      description:
        'The path where the security.txt file was requested (e.g., /.well-known/security.txt or /security.txt).',
    },
    url: {
      type: GraphQLString,
      description: 'The full URL used to fetch the security.txt file.',
    },
    statusCode: {
      type: GraphQLInt,
      description: 'The HTTP status code returned when requesting the security.txt file.',
    },
    fields: {
      type: GraphQLJSONObject,
      description: 'Parsed fields from the security.txt file as key-value pairs.',
    },
    isValid: {
      type: GraphQLBoolean,
      description: 'Whether the security.txt file was found and successfully parsed.',
    },
    error: {
      type: GraphQLString,
      description: 'Any errors encountered during fetching or parsing the security.txt file.',
    },
    raw: {
      type: GraphQLString,
      description: 'The raw contents of the security.txt file, if available.',
    },
    redirected: {
      type: GraphQLBoolean,
      description: 'Whether the request for security.txt was redirected.',
    },
    redirectLocation: {
      type: GraphQLString,
      description: 'The location to which the request was redirected, if any.',
    },
    redirectStatusCode: {
      type: GraphQLInt,
      description: 'The HTTP status code returned by any redirect encountered.',
    },
  }),
})
