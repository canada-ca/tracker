async function getNewDomainUpdateLogs({ query }) {
  const TWENTY_FOUR_HOURS = 1000 * 60 * 60 * 24
  let cursor
  try {
    cursor = await query`
        FOR log IN auditLogs
            FILTER (DATE_NOW() - DATE_TIMESTAMP(log.timestamp)) < ${TWENTY_FOUR_HOURS}
            FILTER log.action == 'update' && log.target.resourceType == 'domain'
            RETURN log
    `
    return await cursor.all()
  } catch (err) {
    throw new Error('Error occured while trying to find new CVD enrollments', { cause: err })
  }
}

module.exports = { getNewDomainUpdateLogs }
