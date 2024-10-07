import { GraphQLList, GraphQLNonNull } from 'graphql'

import { Year } from '../../scalars'
import { PeriodEnums } from '../../enums'
import { chartSummaryType } from '../objects'

export const findChartSummaries = {
  type: new GraphQLList(chartSummaryType),
  description: 'Select domains a user has access to.',
  args: {
    month: {
      type: new GraphQLNonNull(PeriodEnums),
      description: 'The month in which the returned data is relevant to.',
    },
    year: {
      type: new GraphQLNonNull(Year),
      description: 'The year in which the returned data is relevant to.',
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

    const summaryConnections = await loadChartSummariesByPeriod({
      period: args.month,
      ...args,
    })

    console.info(`User: ${userKey} successfully retrieved their chart summaries.`)

    return summaryConnections
  },
}
