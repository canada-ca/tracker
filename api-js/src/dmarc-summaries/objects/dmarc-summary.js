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
      resolve: ({ selectedMonth }) => selectedMonth,
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
      resolve: ({ categoryTotals }) => categoryTotals,
    },
    categoryTotals: {
      type: categoryTotalsType,
      description: 'Category totals for quick viewing.',
      resolve: ({ categoryTotals }) => categoryTotals,
    },
    detailTables: {
      type: detailTablesType,
      description: 'Various senders for each category.',
      resolve: ({ detailTables }) => detailTables,
    },
  }),
  interfaces: [nodeInterface],
})
