const { t } = require('@lingui/macro')

const checkPermission = ({ i18n, userId, query }) => async ({ orgId }) => {
  let cursor
  const userIdString = `users/${userId}`
  // Check for super admin
  try {
    cursor = await query`
      FOR v, e IN 1 INBOUND ${userIdString} affiliations
        FILTER e.permission == "super_admin"
        RETURN e.permission
    `
  } catch (err) {
    console.error(
      `Database error when checking to see if user: ${userIdString} has super admin permission: ${err}`,
    )
    throw new Error(i18n._(t`Authentication error. Please sign in again.`))
  }

  let permission
  try {
    permission = await cursor.next()
  } catch (err) {
    console.error(
      `Cursor error when checking to see if user ${userIdString} has super admin permission: ${err}`,
    )
    throw new Error(i18n._(t`Unable to check permission. Please try again.`))
  }

  if (permission === 'super_admin') {
    return permission
  } else {
    // Check for other permission level
    try {
      cursor = await query`
      FOR v, e IN 1 INBOUND ${userIdString} affiliations
        FILTER e._from == ${orgId}
        RETURN e.permission
    `
    } catch (err) {
      console.error(
        `Database error occurred when checking ${userIdString}'s permission: ${err}`,
      )
      throw new Error(i18n._(t`Authentication error. Please sign in again.`))
    }

    try {
      permission = await cursor.next()
    } catch (err) {
      console.error(`Cursor error when checking ${userIdString}'s permission: ${err}`)
      throw new Error(i18n._(t`Unable to check permission. Please try again.`))
    }
    return permission
  }
}

module.exports = {
  checkPermission,
}
