const { findDomainClaims } = require('./database')
const { notifySendOrgProgressReport } = require('./notify')

const progressReportService = async ({ query, log, notifyClient }) => {}

module.exports = {
  progressReportService,
}
