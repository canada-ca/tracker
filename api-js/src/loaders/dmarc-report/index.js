const { generateDetailTableFields } = require('./generate-detail-table-fields')
const { generateGqlQuery } = require('./generate-gql-query')
const { dmarcReportLoader } = require('./load-dmarc-report')

module.exports = {
  generateDetailTableFields,
  generateGqlQuery,
  dmarcReportLoader,
}
