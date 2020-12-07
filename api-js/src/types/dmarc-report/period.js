const { GraphQLObjectType } = require('graphql')
const { categoryPercentagesType } = require('./category-percentages')
const { categoryTotalsType } = require('./category-totals')
const { detailTablesType } = require('./detail-tables')
const { PeriodEnums } = require('../../enums')
const { Domain, Year } = require('../../scalars')

const periodType = new GraphQLObjectType({
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
      resolve: ({ startDate }, _, { moment }) =>
        String(moment(startDate).format('MMMM')).toLowerCase(),
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

module.exports = {
  periodType,
}
