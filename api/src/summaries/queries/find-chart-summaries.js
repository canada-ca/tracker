import { GraphQLList, GraphQLString, GraphQLInt } from 'graphql'

import { chartSummaryType } from '../objects'
import { ChartSummaryScopeEnums, SummarySourceEnums, OrderDirection } from '../../enums'

export const findChartSummaries = {
  type: new GraphQLList(chartSummaryType),
  description: 'Select chart summaries a user has access to.',
  args: {
    startDate: {
      type: GraphQLString,
      description: 'The start date for the returned data (YYYY-MM-DD).',
    },
    endDate: {
      type: GraphQLString,
      description: 'The end date for the returned data (YYYY-MM-DD).',
    },
    sortDirection: {
      type: OrderDirection,
      description: 'The direction in which to sort the data (ASC or DESC).',
    },
    limit: {
      type: GraphQLInt,
      description: 'The maximum amount of summaries to be returned.',
    },
    scope: {
      type: ChartSummaryScopeEnums,
      description: 'The set of organizations the returned summaries should cover. Defaults to verified.',
    },
    source: {
      type: SummarySourceEnums,
      description: 'Which collection to read from. Rebuild is restricted to super admins. Defaults to live.',
    },
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired, loginRequiredBool, verifiedRequired, superAdminRequired },
      dataSources: { summaries },
    },
  ) => {
    if (loginRequiredBool) {
      const user = await userRequired()
      verifiedRequired({ user })
    }

    if (args.source === 'rebuild') {
      const user = await userRequired()
      const isSuperAdmin = await checkSuperAdmin()
      superAdminRequired({ user, isSuperAdmin })
    }

    const summaryConnections = await summaries.getConnectionsByPeriod({ ...args })

    console.info(`User: ${userKey} successfully retrieved their chart summaries.`)
    return summaryConnections
  },
}
