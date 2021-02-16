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

export const dmarcType = new GraphQLObjectType({
  name: 'DMARC',
  fields: () => ({
    id: globalIdField('dmarc'),
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
      args: {
        ...connectionArgs,
      },
      description: `Key tags found during DMARC Scan.`,
      resolve: async (
        { guidanceTags },
        args,
        { loaders: { dmarcGuidanceTagConnectionsLoader } },
      ) => {
        const dmarcTags = await dmarcGuidanceTagConnectionsLoader({
          dmarcGuidanceTags: guidanceTags,
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

export const dmarcConnection = connectionDefinitions({
  name: 'DMARC',
  nodeType: dmarcType,
  connectionFields: () => ({
    totalCount: {
      type: GraphQLInt,
      description: 'The total amount of dmarc scans related to a given domain.',
      resolve: ({ totalCount }) => totalCount,
    },
  }),
})
