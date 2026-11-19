/**
 * Lists users with admin or owner permission in one organization.
 * @param {{query: Function, orgKey: string}} params - Tagged-template query function and organization key.
 * @returns {Promise<Array<object>>} User documents.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
const getOrgAdmins = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER e.permission == "admin" OR e.permission == "owner"
            RETURN v
    `
  } catch (err) {
    throw new Error('Database error occurred while trying to find org admins', { cause: err })
  }

  let orgAdmins
  try {
    orgAdmins = await cursor.all()
  } catch (err) {
    throw new Error('Cursor error occurred while trying to find org admins', { cause: err })
  }

  return orgAdmins
}

module.exports = {
  getOrgAdmins,
}
