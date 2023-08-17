const getNewAuditLogs = async ({ query, orgKey, days = 1 }) => {
  const twentyFourHours = 1000 * 60 * 60 * 24
  let cursor
  try {
    cursor = await query`
        LET timeframe = ${twentyFourHours} * ${days}
        let currentTime = DATE_NOW()
        FOR log IN auditLogs
            let logTime = DATE_TIMESTAMP(log.timestamp)
            FILTER log.target.organization.id == ${orgKey}
            FILTER (currentTime - logTime) < timeframe
            RETURN log
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find audit logs: ${err}`)
  }

  let auditLogs
  try {
    auditLogs = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find audit logs: ${err}`)
  }

  // do not send out emails if only scans and exports
  if (auditLogs.length === auditLogs.filter((log) => ['scan', 'export'].includes(log.action))) return []
  else return auditLogs
}

module.exports = {
  getNewAuditLogs,
}
