import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'
import { GraphQLDateTime, GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { guidanceTagConnection } from '../../guidance-tag'
import { nodeInterface } from '../../node'

export const httpsType = new GraphQLObjectType({
  name: 'HTTPS',
  fields: () => ({
    id: globalIdField('https'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { domainLoaderByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await domainLoaderByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDateTime,
      description: `The time the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    implementation: {
      type: GraphQLString,
      description: `State of the HTTPS implementation on the server and any issues therein.`,
      resolve: ({ implementation }) => implementation,
    },
    enforced: {
      type: GraphQLString,
      description: `Degree to which HTTPS is enforced on the server based on behaviour.`,
      resolve: ({ enforced }) => enforced,
    },
    hsts: {
      type: GraphQLString,
      description: `Presence and completeness of HSTS implementation.`,
      resolve: ({ hsts }) => hsts,
    },
    hstsAge: {
      type: GraphQLString,
      description: `Denotes how long the domain should only be accessed using HTTPS`,
      resolve: ({ hstsAge }) => hstsAge,
    },
    preloaded: {
      type: GraphQLString,
      description: `Denotes whether the domain has been submitted and included within HSTS preload list.`,
      resolve: ({ preloaded }) => preloaded,
    },
    rawJson: {
      type: GraphQLJSON,
      description: 'Raw scan result.',
      resolve: ({ rawJson }) => JSON.stringify(rawJson),
    },
    guidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { httpsGuidanceTagConnectionsLoader } },
      ) => {
        const httpsTags = await httpsGuidanceTagConnectionsLoader({
          httpsGuidanceTags: guidanceTags,
          ...args,
        })
        return httpsTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Hyper Text Transfer Protocol Secure scan results.`,
})

export const httpsConnection = connectionDefinitions({
  name: 'HTTPS',
  nodeType: httpsType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
