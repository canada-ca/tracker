import { GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'
import { GraphQLJSON, GraphQLDate } from 'graphql-scalars'

import { domainType } from '../../domain/objects'
import { nodeInterface } from '../../node'
import { guidanceTagOrder } from '../../guidance-tag/inputs'
import { guidanceTagConnection } from '../../guidance-tag/objects'

export const dmarcType = new GraphQLObjectType({
  name: 'DMARC',
  fields: () => ({
    id: globalIdField('dmarc'),
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
      description: `The time when the scan was initiated.`,
      resolve: ({ timestamp }) => new Date(timestamp),
    },
    record: {
      type: GraphQLString,
      description: `DMARC record retrieved during scan.`,
      resolve: ({ record }) => record,
    },
    pPolicy: {
      type: GraphQLString,
      description: `The requested policy you wish mailbox providers to apply
when your email fails DMARC authentication and alignment checks. `,
      resolve: ({ pPolicy }) => pPolicy,
    },
    spPolicy: {
      type: GraphQLString,
      description: `This tag is used to indicate a requested policy for all
subdomains where mail is failing the DMARC authentication and alignment checks.`,
      resolve: ({ spPolicy }) => spPolicy,
    },
    pct: {
      type: GraphQLInt,
      description: `The percentage of messages to which the DMARC policy is to be applied.`,
      resolve: ({ pct }) => pct,
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
      description: `Guidance tags found during DMARC Scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { loadDmarcGuidanceTagConnectionsByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagConnectionsByTagId({
          dmarcGuidanceTags: guidanceTags,
          ...args,
        })
        return dmarcTags
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
      description: `Negative guidance tags found during DMARC Scan.`,
      resolve: async (
        { negativeTags },
        args,
        { loaders: { loadDmarcGuidanceTagConnectionsByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagConnectionsByTagId({
          dmarcGuidanceTags: negativeTags,
          ...args,
        })
        return dmarcTags
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
      description: `Neutral guidance tags found during DMARC Scan.`,
      resolve: async (
        { neutralTags },
        args,
        { loaders: { loadDmarcGuidanceTagConnectionsByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagConnectionsByTagId({
          dmarcGuidanceTags: neutralTags,
          ...args,
        })
        return dmarcTags
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
      description: `Positive guidance tags found during DMARC Scan.`,
      resolve: async (
        { positiveTags },
        args,
        { loaders: { loadDmarcGuidanceTagConnectionsByTagId } },
      ) => {
        const dmarcTags = await loadDmarcGuidanceTagConnectionsByTagId({
          dmarcGuidanceTags: positiveTags,
          ...args,
        })
        return dmarcTags
      },
    },
  }),
  interfaces: [nodeInterface],
  description: `Domain-based Message Authentication, Reporting, and Conformance
(DMARC) is a scalable mechanism by which a mail-originating
organization can express domain-level policies and preferences for
message validation, disposition, and reporting, that a mail-receiving
organization can use to improve mail handling.`,
})
