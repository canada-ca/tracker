const { findChartSummaries, findOrgSummaries, getOrgAdmins } = require('./database')
const { sendOrgProgressReport } = require('./notify')

const { REDIRECT_TO_SERVICE_ACCOUNT_EMAIL, SERVICE_ACCOUNT_EMAIL } = process.env

const progressReportService = async ({ query, log, notifyClient }) => {
  // get date 30 days ago
  const today = new Date()
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 365)).toISOString().split('T')[0]

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
  log('Successfully calculated chart stats')

  // calculate individual org stats
  const verifiedOrgSummaries = await findOrgSummaries({ query, log, startDate: thirtyDaysAgo })
  const verifiedOrgStats = {}
  for (const [_key, value] of Object.entries(verifiedOrgSummaries)) {
    const { startSummary, endSummary, orgDetails, _id } = value
    const orgStats = calculateSummaryStats({
      startSummary,
      endSummary,
    })
    if (isNaN(orgStats.httpsScoreDiff) || isNaN(orgStats.dmarcScoreDiff)) continue
    verifiedOrgStats[_key] = { ...orgStats, orgDetails, _id }
  }

  // calculate overall org averages
  const verifiedOrgAverages = calculateOrgAverages({ log, stats: verifiedOrgStats })

  // send notifications
  for (const [_key, value] of Object.entries(verifiedOrgStats)) {
    if (REDIRECT_TO_SERVICE_ACCOUNT_EMAIL) {
      const user = {
        userName: SERVICE_ACCOUNT_EMAIL,
        displayName: 'Service Account',
        _key: 'service-account',
      }
      await sendOrgProgressReport({
        log,
        notifyClient,
        user,
        orgStats: value,
        orgAverages: verifiedOrgAverages,
        chartStats,
      })
    } else {
      const orgAdmins = await getOrgAdmins({ query, orgId: value._id })
      for (const user of orgAdmins) {
        await sendOrgProgressReport({
          log,
          notifyClient,
          user,
          orgStats: value,
          orgAverages: verifiedOrgAverages,
          chartStats,
        })
      }
    }
  }
}

const calculateSummaryStats = ({ startSummary, endSummary }) => {
  // calculate https diff
  const startHttpsScore = startSummary.https.pass / startSummary.https.total
  const endHttpsScore = endSummary.https.pass / endSummary.https.total
  const httpsScoreDiff = (endHttpsScore - startHttpsScore) * 100
  const webDomainCountDiff = endSummary.https.total - startSummary.https.total

  // calculate dmarc diff
  const startDmarcScore = startSummary.dmarc.pass / startSummary.dmarc.total
  const endDmarcScore = endSummary.dmarc.pass / endSummary.dmarc.total
  const dmarcScoreDiff = (endDmarcScore - startDmarcScore) * 100
  const domainCountDiff = endSummary.dmarc.total - startSummary.dmarc.total

  return {
    httpsScoreDiff: httpsScoreDiff.toFixed(2),
    webDomainCountDiff: webDomainCountDiff.toFixed(0),
    dmarcScoreDiff: dmarcScoreDiff.toFixed(2),
    domainCountDiff: domainCountDiff.toFixed(0),
  }
}

const calculateOrgAverages = ({ stats, log }) => {
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

  log('Successfully calculated org averages')
  return {
    httpsScoreDiffAvg: average(httpsScoreDiffs).toFixed(2),
    webDomainCountDiffAvg: average(webDomainCountDiffs).toFixed(0),
    dmarcScoreDiffAvg: average(dmarcScoreDiffs).toFixed(2),
    domainCountDiffAvg: average(domainCountDiffs).toFixed(0),
  }
}

const average = (array) => {
  return array.reduce((a, b) => a + b) / array.length
}

module.exports = {
  progressReportService,
}
