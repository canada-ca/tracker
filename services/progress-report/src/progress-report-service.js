const { findOrgSummaries, getOrgAdmins } = require('./database')
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
    const orgAdmins = await getOrgAdmins({ query, orgId: value._id })
    for (const user of orgAdmins) {
      await sendOrgProgressReport({
        log,
        notifyClient,
        user,
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
    httpsScore: endHttpsScore.toFixed(1) * 100,
    dmarcScore: endDmarcScore.toFixed(1) * 100,
    domainCount: endSummary.dmarc.total,
    httpsScoreDiff: httpsScoreDiff.toFixed(1),
    dmarcScoreDiff: dmarcScoreDiff.toFixed(1),
    domainCountDiff,
  }
}

module.exports = {
  progressReportService,
}
