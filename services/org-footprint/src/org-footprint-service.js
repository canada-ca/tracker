const {
  getOrgAdmins,
  getAllOrgKeys,
  getNewAuditLogs,
  getBilingualOrgNames,
  getPendingOrgUserCount,
  getOrgUsers,
} = require('./database')
const { sendOrgFootprintEmail, sendPendingOrgUsersEmail } = require('./notify')
const logger = require('./logger')

const orgFootprintService = async ({ config, logger, query, notifyClient }) => {
  const orgKeys = await getAllOrgKeys({ query })
  for (const orgKey of orgKeys) {
    const orgNames = await getBilingualOrgNames({ query, orgKey })
    const auditLogs = await getNewAuditLogs({ query, orgKey })
    if (auditLogs.length > 0) {
      const orgUsers = await getOrgUsers({ query, orgKey })
      if (config.redirect) {
        orgUsers.push({
          userName: config.serviceAccount,
          displayName: 'Service Account',
          _key: 'service-account',
        })
      }

      logger.info({ orgKey, auditLogCount: auditLogs.length }, 'Sending recent activity email to admins of org')
      for (const user of orgUsers) {
        await sendOrgFootprintEmail({ notifyClient, user, logger, auditLogs, orgNames })
      }
    }

    const pendingUserCount = await getPendingOrgUserCount({ query, orgKey })
    if (pendingUserCount > 0) {
      const orgAdmins = await getOrgAdmins({ query, orgKey })
      logger.info({ orgKey, pendingUserCount }, 'Sending pending users email to admins of org')
      for (const admin of orgAdmins) {
        await sendPendingOrgUsersEmail({ notifyClient, logger, user: admin, orgNames })
      }
    }
  }
}

module.exports = {
  orgFootprintService,
}
