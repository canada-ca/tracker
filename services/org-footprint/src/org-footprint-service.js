const {
  getOrgAdmins,
  getAllOrgKeys,
  getNewAuditLogs,
  getBilingualOrgNames,
  getPendingOrgUserCount,
  getOrgUsers,
} = require('./database')
const { sendOrgFootprintEmail, sendPendingOrgUsersEmail } = require('./notify')

const { SERVICE_ACCOUNT_EMAIL, REDIRECT_TO_SERVICE_ACCOUNT_EMAIL } = process.env

const orgFootprintService = async ({ query, log, notifyClient }) => {
  const orgKeys = await getAllOrgKeys({ query })
  for (const orgKey of orgKeys) {
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

      const orgNames = await getBilingualOrgNames({ query, orgKey })
      log(`Sending recent activity email to admins of org: ${orgKey}`)
      for (const user of orgUsers) {
        await sendOrgFootprintEmail({ notifyClient, user, auditLogs, orgNames })
      }
    }

    const pendingUserCount = await getPendingOrgUserCount({ query, orgKey })
    if (pendingUserCount > 0) {
      const orgNames = await getBilingualOrgNames({ query, orgKey })
      const orgAdmins = await getOrgAdmins({ query, orgKey })
      log(`Sending pending users email to admins of org: ${orgKey}`)
      for (const admin of orgAdmins) {
        await sendPendingOrgUsersEmail({ notifyClient, user: admin, orgNames })
      }
    }
  }
}

module.exports = {
  orgFootprintService,
}
