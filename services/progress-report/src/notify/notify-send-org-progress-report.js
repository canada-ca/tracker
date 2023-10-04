const { NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

const notifySendOrgProgressReport = async ({ user, orgStats, orgAverages, chartStats, notifyClient }) => {
  const templateId = NOTIFICATION_ORG_PROGRESS_REPORT
  const { httpsScoreDiff, webDomainCountDiff, dmarcScoreDiff, domainCountDiff, orgDetails } = orgStats

  const { httpsScoreDiffAvg, webDomainCountDiffAvg, dmarcScoreDiffAvg, domainCountDiffAvg } = orgAverages

  const { chartHttpsScoreDiff, chartWebDomainCountDiff, chartDmarcScoreDiff, chartDomainCountDiff } = chartStats

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        org_name_en: orgDetails.en.name,
        org_name_fr: orgDetails.fr.name,

        https_score_diff: httpsScoreDiff > 0 ? `+${httpsScoreDiff}` : httpsScoreDiff,
        web_domain_count_diff: webDomainCountDiff > 0 ? `+${webDomainCountDiff}` : webDomainCountDiff,
        dmarc_score_diff: dmarcScoreDiff > 0 ? `+${dmarcScoreDiff}` : dmarcScoreDiff,
        domain_count_diff: domainCountDiff > 0 ? `+${domainCountDiff}` : domainCountDiff,

        https_score_diff_avg: httpsScoreDiffAvg > 0 ? `+${httpsScoreDiffAvg}` : httpsScoreDiffAvg,
        web_domain_count_diff_avg: webDomainCountDiffAvg > 0 ? `+${webDomainCountDiffAvg}` : webDomainCountDiffAvg,
        dmarc_score_diff_avg: dmarcScoreDiffAvg > 0 ? `+${dmarcScoreDiffAvg}` : dmarcScoreDiffAvg,
        domain_count_diff_avg: domainCountDiffAvg > 0 ? `+${domainCountDiffAvg}` : domainCountDiffAvg,

        chart_https_score_diff: chartHttpsScoreDiff > 0 ? `+${chartHttpsScoreDiff}` : chartHttpsScoreDiff,
        chart_web_domain_count_diff:
          chartWebDomainCountDiff > 0 ? `+${chartWebDomainCountDiff}` : chartWebDomainCountDiff,
        chart_dmarc_score_diff: chartDmarcScoreDiff > 0 ? `+${chartDmarcScoreDiff}` : chartDmarcScoreDiff,
        chart_domain_count_diff: chartDomainCountDiff > 0 ? `+${chartDomainCountDiff}` : chartDomainCountDiff,
      },
    })
  } catch (err) {
    console.error(`Error occurred when sending org progress report via email for ${user._key}: ${err}`)
  }
}

module.exports = {
  notifySendOrgProgressReport,
}
