const { NOTIFICATION_ORG_PROGRESS_REPORT } = process.env

const notifySendOrgProgressReport = async ({ user, orgStats, orgAverages, chartStats, notifyClient }) => {
  const templateId = NOTIFICATION_ORG_PROGRESS_REPORT
  const { httpsScoreDiff, webDomainCountDiff, dmarcScoreDiff, domainCountDiff, orgDetails } = orgStats

  const message = `
    <p>Hi ${user.displayName},</p>
    <p>Here is your monthly progress report for your organization.</p>
    <p>Overall Stats:</p>
    <p>HTTPS Score: ${httpsScoreDiff}%</p>
    <p>Web Domains: ${webDomainCountDiff}</p>
    <p>DMARC Score: ${dmarcScoreDiff}%</p>
    <p>Domain Count: ${domainCountDiff}</p>
    <p>Thanks,</p>
    <p>DMARC Report Team</p>
  `

  try {
    await notifyClient.sendEmail(templateId, user.userName, {
      personalisation: {},
    })
  } catch (err) {
    console.error(`Error occurred when sending org progress report via email for ${user._key}: ${err}`)
  }
}

module.exports = {
  notifySendOrgProgressReport,
}
