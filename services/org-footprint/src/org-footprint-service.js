const { getOrgAdmins, getAllOrgKeys, getNewAuditLogs } = require('./database')
const { notifyClient, sendOrgFootprintEmail } = require('./notify')

const orgFootprintService = async ({ query, log }) => {
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
        // send email to org admins
        for (const user of orgAdmins) {
          log(`Sending email to ${user.email}`)
          await sendOrgFootprintEmail({ notifyClient, user, auditLogs })
        }
      }
    }
  }
}

module.exports = {
  orgFootprintService,
}
