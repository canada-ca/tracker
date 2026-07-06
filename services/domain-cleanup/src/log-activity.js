const logger = require('./logger')

const logActivity = async ({
  query,
  initiatedBy = {
    id: '',
    userName: '',
    ipAddress: '', // IP address of user
    role: '', // permission level of user
    organization: '', // org affiliation of user
  },
  action = '',
  target = {
    resource: '', // name of resource being acted upon
    organization: '', // affiliated org (optional)
    resourceType: '', // user, org, domain
    updatedProperties: [],
  },
  reason = '',
}) => {
  const auditLog = {
    timestamp: new Date().toISOString(),
    initiatedBy,
    target,
    action,
    reason,
  }

  try {
    await (
      await query`
        WITH auditLogs
        INSERT ${auditLog} INTO auditLogs
        RETURN MERGE(
          {
            id: NEW._key,
            _type: "auditLog"
          },
          NEW
        )
    `
    ).all()
  } catch (err) {
    logger.error({ err, auditLog }, `Error while logging domain removal`)
    throw err
  }

  return auditLog
}

module.exports = { logActivity }
