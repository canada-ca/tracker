import { GraphQLList, GraphQLString, GraphQLInt } from 'graphql'

import { chartSummaryType } from '../objects'
import { OrderDirection } from '../../enums'

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
  },
  resolve: async (
    _,
    args,
    { userKey, auth: { userRequired, loginRequiredBool, verifiedRequired }, loaders: { loadChartSummariesByPeriod } },
  ) => {
    if (loginRequiredBool) {
      const user = await userRequired()
      verifiedRequired({ user })
    }

    const summaryConnections = await loadChartSummariesByPeriod({ ...args })

    console.info(`User: ${userKey} successfully retrieved their chart summaries.`)
    return summaryConnections
  },
}
