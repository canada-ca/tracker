const checkPermission = async (userId, orgId, query) => {
  let cursor

  // Check for super admin
  try {
    cursor = await query`
      FOR v, e IN 1 INBOUND ${userId} affiliations
        FILTER e.permission == "super_admin"
        RETURN e.permission
    `
  } catch (err) {
    console.error(
      `Database error when checking to see if user: ${userId} has super admin permission: ${err}`,
    )
    throw new Error('Authentication error. Please sign in again.')
  }

  let permission = await cursor.next()
  if (permission === 'super_admin') {
    return permission
  } else {
    // Check for other permission level
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

    permission = await cursor.next()
    return permission
  }
}

module.exports = {
  checkPermission,
}
