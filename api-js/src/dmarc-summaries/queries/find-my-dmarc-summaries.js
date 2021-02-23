import { GraphQLNonNull } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { dmarcSummaryOrder } from '../inputs'
import { dmarcSummaryConnection } from '../objects'
import { PeriodEnums } from '../../enums'
import { Year } from '../../scalars'

export const findMyDmarcSummaries = {
  type: dmarcSummaryConnection.connectionType,
  description: 'Query for dmarc summaries the user has access to.',
  args: {
    orderBy: {
      type: dmarcSummaryOrder,
      description: 'Ordering options for dmarc summaries connections',
    },
    month: {
      type: GraphQLNonNull(PeriodEnums),
      description: 'The month in which the returned data is relevant to.',
    },
    year: {
      type: GraphQLNonNull(Year),
      description: 'The year in which the returned data is relevant to.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired },
      loaders: { dmarcSumLoaderConnectionsByUserId },
    },
  ) => {
    await userRequired()

    const isSuperAdmin = await checkSuperAdmin()

    const dmarcSummaries = await dmarcSumLoaderConnectionsByUserId({
      period: args.month,
      isSuperAdmin,
      ...args,
    })

    console.info(`User ${userKey} successfully retrieved their dmarc summaries`)

    return dmarcSummaries
  },
}
