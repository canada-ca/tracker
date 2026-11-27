/**
 * Finds domain update audit logs inside the time window, across all organizations.
 * @param {{query: Function, window: number}} params - Tagged-template query function and window in milliseconds.
 * @returns {Promise<Array<object>>} Audit logs with action `update` and resource type `domain`.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
async function getNewDomainUpdateLogs({ query, window }) {
  let cursor
  try {
    cursor = await query`
        FOR log IN auditLogs
            FILTER (DATE_NOW() - DATE_TIMESTAMP(log.timestamp)) < ${window}
            FILTER log.action == 'update' && log.target.resourceType == 'domain'
            RETURN log
    `
    return await cursor.all()
  } catch (err) {
    throw new Error('Error occurred while trying to find new domain update logs', { cause: err })
  }
}

module.exports = { getNewDomainUpdateLogs }
