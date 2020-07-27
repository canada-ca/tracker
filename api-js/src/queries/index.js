const { GraphQLObjectType } = require('graphql')
const { i18n: internationalization } = require('lingui-i18n')
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

// const createQuerySchema = i18n => {
const createQuerySchema = () => {
  return new GraphQLObjectType({
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
}

module.exports = {
  createQuerySchema,
}
