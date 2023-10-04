const { findChartSummaries, findOrgSummaries } = require('./database')
const { notifySendOrgProgressReport } = require('./notify')

const progressReportService = async ({ query, log, notifyClient }) => {
  // get date 30 days ago
  const today = new Date()
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30))

  // calculate overall stats
  const chartSummaries = await findChartSummaries({ query, log, startDate: thirtyDaysAgo, endDate: today })

  // calculate individual org stats
  const verifiedOrgSummaries = await findOrgSummaries({ query, log, startDate: thirtyDaysAgo })

  // calculate org averages
  for (const orgSummary of verifiedOrgSummaries) {
    // calculate org averages
    orgSummary.averages = {}
  }

  // send notifications
  for (const orgSummary of verifiedOrgSummaries) {
    await notifySendOrgProgressReport({ query, log, notifyClient, orgSummary })
  }
}

module.exports = {
  progressReportService,
}
