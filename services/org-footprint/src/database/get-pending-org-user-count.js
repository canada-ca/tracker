/**
 * Counts users with a pending invite in one organization.
 * @param {{query: Function, orgKey: string}} params - Tagged-template query function and organization key.
 * @returns {Promise<number>} Number of pending users.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
const getPendingOrgUserCount = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER e.permission == "pending"
            RETURN v
    `
  } catch (err) {
    throw new Error('Database error occurred while trying to find pending users', { cause: err })
  }

  let pendingUserCount
  try {
    pendingUserCount = await cursor.all()
  } catch (err) {
    throw new Error('Cursor error occurred while trying to find pending users', { cause: err })
  }

  return pendingUserCount.length
}

module.exports = {
  getPendingOrgUserCount,
}
