import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import {
  connectionArgs,
  connectionDefinitions,
  globalIdField,
} from 'graphql-relay'
import { GraphQLJSON } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'
import { guidanceTagConnection } from '../../guidance-tag'

export const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    id: globalIdField('spf'),
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
      description: `The time the scan was initiated.`,
      resolve: ({ timestamp }) => timestamp,
    },
    lookups: {
      type: GraphQLInt,
      description: `The amount of DNS lookups.`,
      resolve: ({ lookups }) => lookups,
    },
    record: {
      type: GraphQLString,
      description: `SPF record retrieved during the scan of the given domain.`,
      resolve: ({ record }) => record,
    },
    spfDefault: {
      type: GraphQLString,
      description: `Instruction of what a recipient should do if there is not a match to your SPF record.`,
      resolve: ({ spfDefault }) => spfDefault,
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
        { loaders: { spfGuidanceTagConnectionsLoader } },
      ) => {
        const spfTags = await spfGuidanceTagConnectionsLoader({
          spfGuidanceTags: guidanceTags,
          ...args,
        })
        return spfTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Email on the Internet can be forged in a number of ways.  In
particular, existing protocols place no restriction on what a sending
host can use as the "MAIL FROM" of a message or the domain given on
the SMTP HELO/EHLO commands.  Version 1 of the Sender Policy Framework (SPF)
protocol is where ADministrative Management Domains (ADMDs) can explicitly
authorize the hosts that are allowed to use their domain names, and a
receiving host can check such authorization.`,
})

export const spfConnection = connectionDefinitions({
  name: 'SPF',
  nodeType: spfType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of spf scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
