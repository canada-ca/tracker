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
    throw new Error('Error occured while trying to find new domain update logs', { cause: err })
  }
}

module.exports = { getNewDomainUpdateLogs }
