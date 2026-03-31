const {
  getOrgAdmins,
  getAllOrgKeys,
  getNewAuditLogs,
  getBilingualOrgNames,
  getPendingOrgUserCount,
  getOrgUsers,
  getPendingCvdEnrollmentCount,
  getOrgOwner,
} = require('./database')
const { sendOrgFootprintEmail, sendPendingOrgUsersEmail, sendPendingCvdEnrollmentEmail } = require('./notify')
const logger = require('logger')

const { SERVICE_ACCOUNT_EMAIL, REDIRECT_TO_SERVICE_ACCOUNT_EMAIL } = process.env

const orgFootprintService = async ({ query, notifyClient }) => {
  const orgKeys = await getAllOrgKeys({ query })
  for (const orgKey of orgKeys) {
    const orgNames = await getBilingualOrgNames({ query, orgKey })
    const auditLogs = await getNewAuditLogs({ query, orgKey })
    if (auditLogs.length > 0) {
      const orgUsers = await getOrgUsers({ query, orgKey })
      if (REDIRECT_TO_SERVICE_ACCOUNT_EMAIL) {
        orgUsers.push({
          userName: SERVICE_ACCOUNT_EMAIL,
          displayName: 'Service Account',
          _key: 'service-account',
        })
      }

      logger.info({ orgKey, auditLogCount: auditLogs.length }, 'Sending recent activity email to admins of org')
      for (const user of orgUsers) {
        await sendOrgFootprintEmail({ notifyClient, user, auditLogs, orgNames })
      }
    }

    const pendingUserCount = await getPendingOrgUserCount({ query, orgKey })
    if (pendingUserCount > 0) {
      const orgAdmins = await getOrgAdmins({ query, orgKey })
      logger.info({ orgKey, pendingUserCount }, 'Sending pending users email to admins of org')
      for (const admin of orgAdmins) {
        await sendPendingOrgUsersEmail({ notifyClient, user: admin, orgNames })
      }
    }

    const pendingEnrollmentCount = await getPendingCvdEnrollmentCount({ query, orgKey })
    if (pendingEnrollmentCount > 0) {
      const orgOwner = await getOrgOwner({ query, orgKey })
      logger.info({ orgKey, pendingEnrollmentCount }, 'Sending pending CVD enrollments email to owner of org')
      await sendPendingCvdEnrollmentEmail({ notifyClient, user: orgOwner, orgNames })
    }
  }
}

module.exports = {
  orgFootprintService,
}
