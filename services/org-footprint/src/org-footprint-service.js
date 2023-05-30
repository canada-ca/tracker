const { getOrgAdmins, getAllOrgKeys, getNewAuditLogs, getBilingualOrgNames } = require('./database')
const { sendOrgFootprintEmail } = require('./notify')

const { SERVICE_ACCOUNT_EMAIL, REDIRECT_TO_SERVICE_ACCOUNT_EMAIL } = process.env

const orgFootprintService = async ({ query, log, notifyClient }) => {
  // get list of all orgs
  const orgKeys = await getAllOrgKeys({ query })
  for (const orgKey of orgKeys) {
    // check for new audit logs
    const auditLogs = await getNewAuditLogs({ query, orgKey })
    // if new audit logs exist
    if (auditLogs.length > 0) {
      if (REDIRECT_TO_SERVICE_ACCOUNT_EMAIL) {
        const orgNames = await getBilingualOrgNames({ query, orgKey })
        log(`Sending recent activity email to service account: ${orgKey}`)
        // send email to service account
        const user = {
          userName: SERVICE_ACCOUNT_EMAIL,
          displayName: 'Service Account',
          preferredLang: 'en',
          _key: 'service-account',
        }
        await sendOrgFootprintEmail({ notifyClient, user, auditLogs, orgNames })
      } else {
        // get list of org admins
        const orgAdmins = await getOrgAdmins({ query, orgKey })
        // if org admins exist
        if (orgAdmins.length > 0) {
          const orgNames = await getBilingualOrgNames({ query, orgKey })
          log(`Sending recent activity email to admins of org: ${orgKey}`)
          // send email to org admins
          for (const user of orgAdmins) {
            await sendOrgFootprintEmail({ notifyClient, user, auditLogs, orgNames })
          }
        }
      }
    }
  }
}

module.exports = {
  orgFootprintService,
}
