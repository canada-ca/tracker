import { GraphQLBoolean, GraphQLInt, GraphQLObjectType, GraphQLString } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { organizationSummaryType } from '../../organization/objects/organization-summary'
import { domainOrder } from '../../domain/inputs'
import { domainConnection } from '../../domain/objects'

export const myTrackerType = new GraphQLObjectType({
  name: 'MyTrackerResult',
  fields: () => ({
    summaries: {
      type: organizationSummaryType,
      description: 'Summaries based on scan types that are preformed on the given organizations domains.',
      resolve: ({ summaries }) => summaries,
    },
    domainCount: {
      type: GraphQLInt,
      description: 'The number of domains associated with this organization.',
      resolve: ({ domainCount }) => domainCount,
    },
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
          description: 'Limit domains to those that belong to an organization that has ownership.',
        },
        search: {
          type: GraphQLString,
          description: 'String used to search for domains.',
        },
        ...connectionArgs,
      },
      resolve: async ({ _id }, args, { loaders: { loadDomainConnectionsByUserId } }) => {
        const connections = await loadDomainConnectionsByUserId({
          ...args,
          myTracker: true,
        })
        return connections
      },
    },
  }),
  description: 'Organization object containing information for a given Organization.',
})
