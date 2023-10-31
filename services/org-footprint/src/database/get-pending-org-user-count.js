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
    throw new Error(`Database error occurred while trying to find pending users: ${err}`)
  }

  let pendingUserCount
  try {
    pendingUserCount = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find pending users: ${err}`)
  }

  return pendingUserCount.length
}

module.exports = {
  getPendingOrgUserCount,
}
