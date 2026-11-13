/**
 * Lists organization members who opted in to org footprint emails.
 * @param {{query: Function, orgKey: string}} params - Tagged-template query function and organization key.
 * @returns {Promise<Array<object>>} User documents.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
const getOrgUsers = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER e.permission IN ["user", "admin", "owner", "super_admin"]
            FILTER v.emailUpdateOptions.orgFootprint == true
            RETURN v
    `
  } catch (err) {
    throw new Error('Database error occurred while trying to find org users', { cause: err })
  }

  let orgUsers
  try {
    orgUsers = await cursor.all()
  } catch (err) {
    throw new Error('Cursor error occurred while trying to find org users', { cause: err })
  }

  return orgUsers
}

module.exports = {
  getOrgUsers,
}
