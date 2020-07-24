const { GraphQLObjectType } = require('graphql')
const { nodeField } = require('../types')
const {
  dmarcReportDetailTables,
  dmarcReportSummary,
  dmarcReportSummaryList,
} = require('./dmarc-report')

const {
  findDomainBySlug,
  findDomainsByOrg,
  findMyDomains,
} = require('./domains')

const query = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    // Node Query
    node: nodeField,
    // Dmarc report queries
    dmarcReportDetailTables,
    dmarcReportSummary,
    dmarcReportSummaryList,
    // Domain Queries
    findDomainBySlug,
    findDomainsByOrg,
    findMyDomains,
  }),
})

module.exports = {
  query,
}
