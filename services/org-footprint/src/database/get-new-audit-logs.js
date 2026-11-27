/**
 * Finds audit logs for one organization inside the time window.
 * @param {{query: Function, orgKey: string, window: number}} params - Tagged-template query function,
 *   organization key, and window in milliseconds.
 * @returns {Promise<Array<object>>} Matching audit logs.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
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
