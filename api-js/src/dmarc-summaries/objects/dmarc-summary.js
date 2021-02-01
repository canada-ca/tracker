import { GraphQLObjectType } from 'graphql'
import { globalIdField } from 'graphql-relay'

import { categoryPercentagesType } from './category-percentages'
import { categoryTotalsType } from './category-totals'
import { detailTablesType } from './detail-tables'
import { PeriodEnums } from '../../enums'
import { Domain, Year } from '../../scalars'
import { nodeInterface } from '../../node'

export const dmarcSummaryType = new GraphQLObjectType({
  name: 'DmarcSummary',
  description: 'Object that contains information for a dmarc summary.',
  fields: () => ({
    id: globalIdField('dmarcSummaries'),
    domain: {
      type: Domain,
      description: 'The domain that the data in this dmarc summary belongs to.',
      resolve: async (
        { domainKey },
        _args,
        { loaders: { domainLoaderByKey } },
      ) => {
        const domain = await domainLoaderByKey.load(domainKey)
        return domain.domain
      },
    },
    month: {
      type: PeriodEnums,
      description: 'Start date of data collection.',
      resolve: ({ startDate }, _, { moment }) => {
        const month = moment(startDate).month()
        return String(moment().month(month).format('MMMM')).toLowerCase()
      },
    },
    year: {
      type: Year,
      description: 'End date of data collection.',
      resolve: ({ startDate }, _, { moment }) =>
        String(moment(startDate).year()),
    },
    categoryPercentages: {
      type: categoryPercentagesType,
      description: 'Category percentages based on the category totals.',
      resolve: async ({ _to }, _, { loaders: { dmarcSumLoaderByKey } }) => {
        const dmarcSummaryKey = _to.split('/')[1]
        const dmarcSummary = await dmarcSumLoaderByKey.load(dmarcSummaryKey)
        return dmarcSummary.categoryTotals
      },
    },
    categoryTotals: {
      type: categoryTotalsType,
      description: 'Category totals for quick viewing.',
      resolve: async ({ _to }, _, { loaders: { dmarcSumLoaderByKey } }) => {
        const dmarcSummaryKey = _to.split('/')[1]
        const dmarcSummary = await dmarcSumLoaderByKey.load(dmarcSummaryKey)
        return dmarcSummary.categoryTotals
      },
    },
    detailTables: {
      type: detailTablesType,
      description: 'Various senders for each category.',
      resolve: ({ _to }) => ({ _to }),
    },
  }),
  interfaces: [nodeInterface],
})
