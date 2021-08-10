import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'
import { guidanceTagOrder } from '../../guidance-tag/inputs'
import { guidanceTagConnection } from '../../guidance-tag/objects'

export const spfType = new GraphQLObjectType({
  name: 'SPF',
  fields: () => ({
    id: globalIdField('spf'),
    domain: {
      type: domainType,
      description: `The domain the scan was ran on.`,
      resolve: async ({ domainId }, _, { loaders: { loadDomainByKey } }) => {
        const domainKey = domainId.split('/')[1]
        const domain = await loadDomainByKey.load(domainKey)
        domain.id = domain._key
        return domain
      },
    },
    timestamp: {
      type: GraphQLDate,
      description: `The time the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
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
      deprecationReason:
        'This has been sub-divided into neutral, negative, and positive tags.',
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: `Guidance tags found during scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { loadSpfGuidanceTagConnectionsByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagConnectionsByTagId({
          spfGuidanceTags: guidanceTags,
          ...args,
        })
        return spfTags
      },
    },
    negativeGuidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: `Negative guidance tags found during scan.`,
      resolve: async (
        { negativeTags },
        args,
        { loaders: { loadSpfGuidanceTagConnectionsByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagConnectionsByTagId({
          spfGuidanceTags: negativeTags,
          ...args,
        })
        return spfTags
      },
    },
    neutralGuidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: `Neutral guidance tags found during scan.`,
      resolve: async (
        { neutralTags },
        args,
        { loaders: { loadSpfGuidanceTagConnectionsByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagConnectionsByTagId({
          spfGuidanceTags: neutralTags,
          ...args,
        })
        return spfTags
      },
    },
    positiveGuidanceTags: {
      type: guidanceTagConnection.connectionType,
      args: {
        orderBy: {
          type: guidanceTagOrder,
          description: 'Ordering options for guidance tag connections',
        },
        ...connectionArgs,
      },
      description: `Positive guidance tags found during scan.`,
      resolve: async (
        { positiveTags },
        args,
        { loaders: { loadSpfGuidanceTagConnectionsByTagId } },
      ) => {
        const spfTags = await loadSpfGuidanceTagConnectionsByTagId({
          spfGuidanceTags: positiveTags,
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
protocol is where Administrative Management Domains (ADMDs) can explicitly
authorize the hosts that are allowed to use their domain names, and a
receiving host can check such authorization.`,
})
