const { GraphQLObjectType, GraphQLString } = require('graphql')
const { categoryPercentagesType } = require('./category-percentages')
const { categoryTotalsType } = require('./category-totals')
const { detailTablesType } = require('./detail-tables')

const periodType = new GraphQLObjectType({
  name: 'Period',
  description:
    'Object that contains information for each data collection period.',
  fields: () => ({
    month: {
      type: GraphQLString,
      description: 'Start date of data collection.',
      resolve: ({ startDate }, _, { moment }) =>
        Number(moment(startDate).month()) + 1,
    },
    year: {
      type: GraphQLString,
      description: 'End date of data collection.',
      resolve: ({ startDate }, _, { moment }) => moment(startDate).year(),
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
