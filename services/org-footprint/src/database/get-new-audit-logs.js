const getNewAuditLogs = async ({ query, orgKey, window }) => {
  let cursor
  try {
    cursor = await query`
        let currentTime = DATE_NOW()
        FOR log IN auditLogs
            let logTime = DATE_TIMESTAMP(log.timestamp)
            FILTER log.target.organization.id == ${orgKey}
            FILTER (currentTime - logTime) < ${window}
            RETURN log
    `
    return await cursor.all()
  } catch (err) {
    throw new Error(`Database error occurred while trying to find audit logs`, { cause: err })
  }
}

module.exports = {
  getNewAuditLogs,
}
