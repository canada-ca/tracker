const { GraphQLString, GraphQLObjectType } = require('graphql')
const { Year } = require('../../scalars')
const { detailTableType } = require('./detail-tables')

const dmarcReportDetailedTablesType = new GraphQLObjectType({
  name: 'DmarcReportDetailedTables',
  description: `GraphQL object for returning data for dmarc report tables.`,
  fields: () => ({
    month: {
      type: GraphQLString,
      description: `The month in which the table data is relevant to.`,
      resolve: async () => {},
    },
    year: {
      type: Year,
      description: `The year in which the data is relevant to.`,
      resolve: async () => {},
    },
    detailTables: {
      type: detailTableType,
      description: `The details used in creating tables for the dmarc report page.`,
      resolve: async () => {},
    },
  }),
})

module.exports = {
  dmarcReportDetailedTablesType,
}
