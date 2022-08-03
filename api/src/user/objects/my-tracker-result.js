import {
  GraphQLBoolean,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLString,
} from 'graphql'
import { connectionArgs, globalIdField } from 'graphql-relay'

import { organizationSummaryType } from '../../organization/objects/organization-summary'
import { nodeInterface } from '../../node'
import { domainOrder } from '../../domain/inputs'
import { domainConnection } from '../../domain/objects'

export const myTrackerType = new GraphQLObjectType({
  name: 'MyTrackerResult',
  fields: () => ({
    id: globalIdField('favourite'),
    summaries: {
      type: organizationSummaryType,
      description:
        'Summaries based on scan types that are preformed on the given organizations domains.',
      resolve: ({ summaries }) => summaries,
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: ({ domainCount }) => domainCount,
    },
    // toCsv: {
    //   type: GraphQLString,
    //   description:
    //     'CSV formatted output of all domains in the organization including their email and web scan statuses.',
    //   resolve: async (
    //     { _id },
    //     _args,
    //     { loaders: { loadOrganizationDomainStatuses } },
    //   ) => {
    //     const domains = await loadOrganizationDomainStatuses({
    //       orgId: _id,
    //     })
    //     const headers = [
    //       'domain',
    //       'https',
    //       'hsts',
    //       'ciphers',
    //       'curves',
    //       'protocols',
    //       'spf',
    //       'dkim',
    //       'dmarc',
    //     ]
    //     let csvOutput = headers.join(',')
    //     domains.forEach((domain) => {
    //       let csvLine = `${domain.domain}`
    //       csvLine += headers.slice(1).reduce((previousValue, currentHeader) => {
    //         return `${previousValue},${domain.status[currentHeader]}`
    //       }, '')
    //       csvOutput += `\n${csvLine}`
    //     })
    //     return csvOutput
    //   },
    // },
    domains: {
      type: domainConnection.connectionType,
      description: 'The domains which are associated with this organization.',
      args: {
        orderBy: {
          type: domainOrder,
          description: 'Ordering options for domain connections.',
        },
        ownership: {
          type: GraphQLBoolean,
          description:
            'Limit domains to those that belong to an organization that has ownership.',
        },
        myTracker: {
          type: GraphQLBoolean,
          description: '',
        },
        search: {
          type: GraphQLString,
          description: 'String used to search for domains.',
        },
        ...connectionArgs,
      },
      resolve: async (
        { _id },
        args,
        { loaders: { loadDomainConnectionsByUserId } },
      ) => {
        const connections = await loadDomainConnectionsByUserId({
          ...args,
        })
        return connections
      },
    },
  }),
  interfaces: [nodeInterface],
  description:
    'Organization object containing information for a given Organization.',
})
