const { GraphQLObjectType, GraphQLString } = require('graphql')
const moment = require('moment')
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
      resolve: async ({ startDate }) => moment(startDate).month(),
    },
    year: {
      type: GraphQLString,
      description: 'End date of data collection.',
      resolve: async ({ startDate }) => moment(startDate).year(),
    },
    categoryTotals: {
      type: categoryTotalsType,
      description: 'Category totals for quick viewing.',
      resolve: async ({ categoryTotals }) => categoryTotals,
    },
    detailTables: {
      type: detailTablesType,
      description: 'Various senders for each category.',
      resolve: async ({ detailTables }) => detailTables,
    },
  }),
})

module.exports = {
  periodType,
}
