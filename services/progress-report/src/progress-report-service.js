const { findOrgSummaries, getOrgUsers, findVulnerabilitiesByOrgId } = require('./database')
const { sendOrgProgressReport } = require('./notify')

const progressReportService = async ({ query, log, notifyClient }) => {
  // get date 30 days ago
  const today = new Date()
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0]

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

  // send notifications
  for (const [_key, value] of Object.entries(verifiedOrgStats)) {
    const vulnerableAssets = await findVulnerabilitiesByOrgId({ query, orgId: value._id })
    const orgUsers = await getOrgUsers({ query, orgId: value._id })
    for (const user of orgUsers) {
      await sendOrgProgressReport({
        log,
        notifyClient,
        user,
        vulnerableAssets,
        orgStats: value,
      })
    }
  }
}

const calculateSummaryStats = ({ startSummary, endSummary }) => {
  // calculate https diff
  const startHttpsScore = startSummary.https.pass / startSummary.https.total
  const endHttpsScore = endSummary.https.pass / endSummary.https.total
  const httpsScoreDiff = (endHttpsScore - startHttpsScore) * 100

  // calculate dmarc diff
  const startDmarcScore = startSummary.dmarc.pass / startSummary.dmarc.total
  const endDmarcScore = endSummary.dmarc.pass / endSummary.dmarc.total
  const dmarcScoreDiff = (endDmarcScore - startDmarcScore) * 100

  // calculate domain count diff
  const domainCountDiff = endSummary.dmarc.total - startSummary.dmarc.total

  return {
    httpsScore: (endHttpsScore * 100).toFixed(1),
    dmarcScore: (endDmarcScore * 100).toFixed(1),
    domainCount: endSummary.dmarc.total,
    httpsScoreDiff: httpsScoreDiff.toFixed(1),
    dmarcScoreDiff: dmarcScoreDiff.toFixed(1),
    domainCountDiff,
  }
}

module.exports = {
  progressReportService,
}
