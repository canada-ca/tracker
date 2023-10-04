const { findChartSummaries, findOrgSummaries, getOrgAdmins } = require('./database')
const { notifySendOrgProgressReport } = require('./notify')

const progressReportService = async ({ query, log, notifyClient }) => {
  // get date 30 days ago
  const today = new Date()
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]

  // calculate overall stats
  const chartSummaries = await findChartSummaries({
    query,
    log,
    startDate: thirtyDaysAgo,
    endDate: new Date().toISOString().split('T')[0],
  })

  const chartStats = calculateSummaryStats({
    startSummary: chartSummaries.startSummary,
    endSummary: chartSummaries.endSummary,
  })

  // calculate individual org stats
  const verifiedOrgSummaries = await findOrgSummaries({ query, log, startDate: thirtyDaysAgo })

  // calculate org averages
  const verifiedOrgStats = {}
  for (const [_key, value] of Object.entries(verifiedOrgSummaries)) {
    const { startSummary, endSummary, orgDetails, _id } = value
    // calculate org averages
    const orgStats = calculateSummaryStats({
      startSummary,
      endSummary,
    })
    verifiedOrgStats[_key] = { ...orgStats, orgDetails, _id }
  }

  const verifiedOrgAverages = calculateOrgAverages({ stats: verifiedOrgStats })
  console.log(verifiedOrgAverages)
  // send notifications
  for (const [_key, value] of Object.entries(verifiedOrgStats)) {
    console.log('org', value)
    const orgAdmins = await getOrgAdmins({ query, orgId: value._id })
    for (const user of orgAdmins) {
      await notifySendOrgProgressReport({
        notifyClient,
        user,
        orgStats: value,
        orgAverages: verifiedOrgAverages,
        chartStats,
      })
    }
  }
}

const calculateSummaryStats = ({ startSummary, endSummary }) => {
  // calculate https diff
  const startHttpsScore = startSummary.https.pass / startSummary.https.total
  const endHttpsScore = endSummary.https.pass / endSummary.https.total
  const httpsScoreDiff = (endHttpsScore - startHttpsScore).toFixed(2) * 100
  const webDomainCountDiff = endSummary.https.total - startSummary.https.total

  // calculate dmarc diff
  const startDmarcScore = startSummary.dmarc.pass / startSummary.dmarc.total
  const endDmarcScore = endSummary.dmarc.pass / endSummary.dmarc.total
  const dmarcScoreDiff = (endDmarcScore - startDmarcScore).toFixed(2) * 100
  const domainCountDiff = endSummary.dmarc.total - startSummary.dmarc.total

  return {
    httpsScoreDiff,
    webDomainCountDiff,
    dmarcScoreDiff,
    domainCountDiff,
  }
}

const calculateOrgAverages = ({ stats }) => {
  const httpsScoreDiffs = []
  const webDomainCountDiffs = []
  const dmarcScoreDiffs = []
  const domainCountDiffs = []

  for (const [_key, value] of Object.entries(stats)) {
    console.log(stats)
    const { httpsScoreDiff, webDomainCountDiff, dmarcScoreDiff, domainCountDiff } = value
    httpsScoreDiffs.push(httpsScoreDiff)
    webDomainCountDiffs.push(webDomainCountDiff)
    dmarcScoreDiffs.push(dmarcScoreDiff)
    domainCountDiffs.push(domainCountDiff)
  }

  return {
    httpsScoreDiff: average(httpsScoreDiffs),
    webDomainCountDiff: average(webDomainCountDiffs),
    dmarcScoreDiff: average(dmarcScoreDiffs),
    domainCountDiff: average(domainCountDiffs),
  }
}

const average = (array) => {
  return array.reduce((a, b) => a + b) / array.length
}

module.exports = {
  progressReportService,
}
