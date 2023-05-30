const { getOrgAdmins, getAllOrgKeys, getNewAuditLogs, getBilingualOrgNames } = require('./database')
const { sendOrgFootprintEmail } = require('./notify')

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
  }
}

module.exports = {
  orgFootprintService,
}
