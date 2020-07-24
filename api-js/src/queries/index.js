const { GraphQLObjectType } = require('graphql')
const { nodeField } = require('../types')
const {
  dmarcReportDetailTables,
  demoDmarcReportDetailTables,
  dmarcReportSummary,
  demoDmarcReportSummary,
  dmarcReportSummaryList,
  demoDmarcReportSummaryList,
} = require('./dmarc-report')
const {
  findDomainBySlug,
  findDomainsByOrg,
  findMyDomains,
} = require('./domains')
const {
  findMyOrganizations,
  findOrganizationBySlug,
} = require('./organizations')
const {
  emailSummary,
  demoEmailSummary,
  webSummary,
  demoWebSummary,
} = require('./summaries')

const query = new GraphQLObjectType({
  name: 'Query',
  fields: () => ({
    // Node Query
    node: nodeField,
    // Dmarc report queries
    dmarcReportDetailTables,
    demoDmarcReportDetailTables,
    dmarcReportSummary,
    demoDmarcReportSummary,
    dmarcReportSummaryList,
    demoDmarcReportSummaryList,
    // Domain Queries
    findDomainBySlug,
    findDomainsByOrg,
    findMyDomains,
    // Organization Queries
    findMyOrganizations,
    findOrganizationBySlug,
    // Summary Queries
    emailSummary,
    demoEmailSummary,
    webSummary,
    demoWebSummary,
  }),
})

module.exports = {
  query,
}
