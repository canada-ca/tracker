const { findChartSummaries, findOrgSummaries, getOrgAdmins } = require('./database')
const { sendOrgProgressReport } = require('./notify')

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
  const verifiedOrgStats = {}
  for (const [_key, value] of Object.entries(verifiedOrgSummaries)) {
    const { startSummary, endSummary, orgDetails, _id } = value
    const orgStats = calculateSummaryStats({
      startSummary,
      endSummary,
    })
    verifiedOrgStats[_key] = { ...orgStats, orgDetails, _id }
  }

  // calculate overall org averages
  const verifiedOrgAverages = calculateOrgAverages({ stats: verifiedOrgStats })

  // send notifications
  for (const [_key, value] of Object.entries(verifiedOrgStats)) {
    const orgAdmins = await getOrgAdmins({ query, orgId: value._id })
    for (const user of orgAdmins) {
      await sendOrgProgressReport({
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
  const chartHttpsScoreDiff = (endHttpsScore - startHttpsScore).toFixed(2) * 100
  const chartWebDomainCountDiff = endSummary.https.total - startSummary.https.total

  // calculate dmarc diff
  const startDmarcScore = startSummary.dmarc.pass / startSummary.dmarc.total
  const endDmarcScore = endSummary.dmarc.pass / endSummary.dmarc.total
  const chartDmarcScoreDiff = (endDmarcScore - startDmarcScore).toFixed(2) * 100
  const chartDomainCountDiff = endSummary.dmarc.total - startSummary.dmarc.total

  return {
    chartHttpsScoreDiff,
    chartWebDomainCountDiff,
    chartDmarcScoreDiff,
    chartDomainCountDiff,
  }
}

const calculateOrgAverages = ({ stats }) => {
  const httpsScoreDiffs = []
  const webDomainCountDiffs = []
  const dmarcScoreDiffs = []
  const domainCountDiffs = []

  for (const [_key, value] of Object.entries(stats)) {
    const { httpsScoreDiff, webDomainCountDiff, dmarcScoreDiff, domainCountDiff } = value
    httpsScoreDiffs.push(httpsScoreDiff)
    webDomainCountDiffs.push(webDomainCountDiff)
    dmarcScoreDiffs.push(dmarcScoreDiff)
    domainCountDiffs.push(domainCountDiff)
  }

  return {
    httpsScoreDiffAvg: average(httpsScoreDiffs),
    webDomainCountDiffAvg: average(webDomainCountDiffs),
    dmarcScoreDiffAvg: average(dmarcScoreDiffs),
    domainCountDiffAvg: average(domainCountDiffs),
  }
}

const average = (array) => {
  return array.reduce((a, b) => a + b) / array.length
}

module.exports = {
  progressReportService,
}
