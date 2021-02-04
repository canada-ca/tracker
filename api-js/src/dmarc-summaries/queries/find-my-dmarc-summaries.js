import { t } from '@lingui/macro'
import { GraphQLNonNull } from 'graphql'
import { connectionArgs } from 'graphql-relay'

import { dmarcSummaryOrder } from '../inputs'
import { dmarcSummaryConnection } from '../objects'
import { PeriodEnums } from '../../enums'
import { Year } from '../../scalars'

export const findMyDmarcSummaries = {
  type: dmarcSummaryConnection.connectionType,
  description: '',
  args: {
    orderBy: {
      type: dmarcSummaryOrder,
      description: '',
    },
    month: {
      type: GraphQLNonNull(PeriodEnums),
      description: '',
    },
    year: {
      type: GraphQLNonNull(Year),
      description: '',
    },
    ...connectionArgs,
  },
  resolve: async (
    _,
    args,
    {
      i18n,
      userKey,
      auth: { userRequired },
      loaders: { dmarcSumLoaderConnectionsByUserId },
    },
  ) => {
    await userRequired()

    let dmarcSummaries
    try {
      dmarcSummaries = await dmarcSumLoaderConnectionsByUserId({
        period: args.month,
        ...args,
      })
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather dmarc summary connections in findMyDmarcSummaries: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load dmarc summaries. Please try again.`),
      )
    }

    console.info(`User ${userKey} successfully retrieved their dmarc summaries`)

    return dmarcSummaries
  },
}
