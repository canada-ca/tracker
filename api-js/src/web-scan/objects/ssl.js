import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { guidanceTagConnection } from '../../guidance-tag'
import { nodeInterface } from '../../node'

export const sslType = new GraphQLObjectType({
  name: 'SSL',
  fields: () => ({
    id: globalIdField('ssl'),
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
      type: GraphQLString,
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
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
        { loaders: { sslGuidanceTagConnectionsLoader } },
      ) => {
        const sslTags = await sslGuidanceTagConnectionsLoader({
          sslGuidanceTags: guidanceTags,
          ...args,
        })
        return sslTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Secure Socket Layer scan results.`,
})

export const sslConnection = connectionDefinitions({
  name: 'SSL',
  nodeType: sslType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of https scans for a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
