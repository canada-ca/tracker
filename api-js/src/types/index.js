const {
  domainType,
  domainConnection,
  organizationType,
  organizationConnection,
  userType,
  userConnection,
  userAffiliationsType,
  userAffiliationsConnection,
} = require('./base')

const { authResultType } = require('./auth-result')
const { categorizedSummaryType } = require('./categorized-summary')
const { dmarcReportDetailedTablesType } = require('./dmarc-report')
const { nodeField, nodeInterface } = require('./node')

module.exports = {
  // Types
  authResultType,
  categorizedSummaryType,
  domainType,
  domainConnection,
  organizationType,
  organizationConnection,
  userType,
  userConnection,
  userAffiliationsType,
  userAffiliationsConnection,
  // Dmarc Report Types
  dmarcReportDetailedTablesType,
  // Node Types
  nodeField,
  nodeInterface,
}
