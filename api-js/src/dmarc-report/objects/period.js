import { GraphQLObjectType } from 'graphql'
import { categoryPercentagesType } from './category-percentages'
import { categoryTotalsType } from './category-totals'
import { detailTablesType } from './detail-tables'
import { PeriodEnums } from '../enums'
import { Domain, Year } from '../scalars'

export const periodType = new GraphQLObjectType({
  name: 'Period',
  description:
    'Object that contains information for each data collection period.',
  fields: () => ({
    domain: {
      type: Domain,
      description: 'The domain that the data in this period belongs to.',
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
})
