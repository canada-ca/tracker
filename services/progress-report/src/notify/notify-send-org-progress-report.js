const { NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

const sendOrgProgressReport = async ({ log, user, orgStats, notifyClient, vulnerableAssets }) => {
  const templateId = NOTIFICATION_ORG_PROGRESS_REPORT
  const { httpsScore, dmarcScore, domainCount, httpsScoreDiff, dmarcScoreDiff, domainCountDiff, orgDetails } = orgStats

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {
        display_name: user.displayName,
        org_name_en: orgDetails.en.name,
        org_name_fr: orgDetails.fr.name,
        https_score: `${httpsScore}%`,
        https_score_diff: httpsScoreDiff >= 0 ? `+${httpsScoreDiff}%` : `${httpsScoreDiff}%`,
        dmarc_score: `${dmarcScore}%`,
        dmarc_score_diff: dmarcScoreDiff >= 0 ? `+${dmarcScoreDiff}%` : `${dmarcScoreDiff}%`,
        domain_count: domainCount,
        domain_count_diff: domainCountDiff >= 0 ? `+${domainCountDiff}` : domainCountDiff,
        vulnerable_domain_count: vulnerableAssets,
      },
    })
    log(`Successfully sent ${orgDetails.en.name} progress report via email to user:, ${user._key}`)
  } catch (err) {
    console.error(`Error occurred when sending org progress report via email for ${user._key}: ${err}`)
  }
}

module.exports = {
  sendOrgProgressReport,
}
