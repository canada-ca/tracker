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

    const dmarcSummaries = await dmarcSumLoaderConnectionsByUserId({
      period: args.month,
      ...args,
    })

    console.info(`User ${userKey} successfully retrieved their dmarc summaries`)

    return dmarcSummaries
  },
}
