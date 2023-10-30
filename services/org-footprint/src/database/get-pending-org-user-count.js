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
    throw new Error(`Database error occurred while trying to find org admins: ${err}`)
  }

  let pendingUserCount
  try {
    pendingUserCount = await cursor.count()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org admins: ${err}`)
  }

  return pendingUserCount
}

module.exports = {
  getPendingOrgUserCount,
}
