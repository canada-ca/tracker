const {
  getOrgAdmins,
  getAllOrgKeys,
  getNewAuditLogs,
  getBilingualOrgNames,
  getPendingOrgUserCount,
} = require('./database')
const { sendOrgFootprintEmail, sendPendingOrgUsersEmail } = require('./notify')

const { SERVICE_ACCOUNT_EMAIL, REDIRECT_TO_SERVICE_ACCOUNT_EMAIL } = process.env

const orgFootprintService = async ({ query, log, notifyClient }) => {
  // get list of all orgs
  const orgKeys = await getAllOrgKeys({ query })
  for (const orgKey of orgKeys) {
    // check for new audit logs
    const auditLogs = await getNewAuditLogs({ query, orgKey })
    // if new audit logs exist
    if (auditLogs.length > 0) {
      // get list of org admins
      const orgAdmins = await getOrgAdmins({ query, orgKey })
      if (REDIRECT_TO_SERVICE_ACCOUNT_EMAIL) {
        // send email to service account
        orgAdmins.push({
          userName: SERVICE_ACCOUNT_EMAIL,
          displayName: 'Service Account',
          _key: 'service-account',
        })
      }
      // if org admins exist
      if (orgAdmins.length > 0) {
        log(`Sending recent activity email to admins of org: ${orgKey}`)
        const orgNames = await getBilingualOrgNames({ query, orgKey })

        // send email to org admins
        for (const user of orgAdmins) {
          await sendOrgFootprintEmail({ notifyClient, user, auditLogs, orgNames })
        }
      }
    }
    // if org has pending users
    const pendingUserCount = await getPendingOrgUserCount({ query, orgKey })
    if (pendingUserCount > 0) {
      const orgAdmins = await getOrgAdmins({ query, orgKey })
      // if org admins exist
      if (orgAdmins.length > 0) {
        log(`Sending pending users email to admins of org: ${orgKey}`)
        const orgNames = await getBilingualOrgNames({ query, orgKey })
        // send email to org admins
        for (const user of orgAdmins) {
          await sendPendingOrgUsersEmail({ notifyClient, user, orgNames })
        }
      }
    }
  }
}

module.exports = {
  orgFootprintService,
}
