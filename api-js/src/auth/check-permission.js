const checkPermission = async (userId, orgId, query) => {
  let cursor

  try {
    cursor = await query`
      FOR v, e IN 1 INBOUND ${userId} affiliations
        FILTER e._from == ${orgId}
        RETURN e.permission
    `
  } catch (err) {
    console.error(
      `Database error occurred when checking ${userId}'s permission: ${err}`,
    )
    throw new Error('Authentication error. Please sign in again.')
  }

  const permission = await cursor.next()
  return permission
}

module.exports = {
  checkPermission,
}
