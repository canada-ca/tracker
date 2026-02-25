const logger = require('../logger')

const { NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

const sendOrgProgressReport = async ({ user, orgStats, notifyClient, vulnerableAssets }) => {
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
    logger.info({ userKey: user._key, orgName: orgDetails.en.name }, 'Successfully sent progress report via email')
  } catch (err) {
    logger.error(
      { err: err, userKey: user._key, orgName: orgDetails.en.name },
      'Error occurred when sending org progress report via email',
    )
  }
}

module.exports = {
  sendOrgProgressReport,
}
