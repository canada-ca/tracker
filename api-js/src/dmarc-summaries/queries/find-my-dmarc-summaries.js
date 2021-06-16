import { GraphQLNonNull, GraphQLString } from 'graphql'
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
    search: {
      type: GraphQLString,
      description:
        'An optional string used to filter the results based on domains.',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      userKey,
      auth: { checkSuperAdmin, userRequired, verifiedRequired },
      loaders: { loadDmarcSummaryConnectionsByUserId },
    },
  ) => {
    const user = await userRequired()

    verifiedRequired({ user })

    const isSuperAdmin = await checkSuperAdmin()

    const dmarcSummaries = await loadDmarcSummaryConnectionsByUserId({
      period: args.month,
      isSuperAdmin,
      ...args,
    })

    console.info(`User ${userKey} successfully retrieved their dmarc summaries`)

    return dmarcSummaries
  },
}
