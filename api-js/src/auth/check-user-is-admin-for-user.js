const { t } = require('@lingui/macro')

const checkUserIsAdminForUser = ({ i18n, userId, query }) => async ({ userName }) => {
  const requestingUserId = `users/${userId}`
  let cursor

  try {
    cursor = await query`
      FOR v, e IN 1 INBOUND ${requestingUserId} affiliations
        FILTER e.permission == "super_admin"
        RETURN e.permission
    `
  } catch (err) {
    console.error(
      `Database error when checking to see if user: ${userId} has super admin permission for user: ${userName}, error: ${err}`,
    )
    throw new Error(i18n._(t`Permission error, not an admin for this user.`))
  }

  let permission
  try {
    permission = await cursor.next()
  } catch (err) {
    console.error(
      `Cursor error when checking to see if user: ${userId} has super admin permission for user: ${userName}, error: ${err}`,
    )
    throw new Error(i18n._(t`Permission error, not an admin for this user.`))
  }

  if (permission === 'super_admin') {
    return true
  } else {
    try {
      cursor = await query`
        LET requestingUserOrgKeys = (
          FOR v, e IN 1 INBOUND ${requestingUserId} affiliations
            FILTER e.permission == "admin"
            RETURN v._key    
        )

        LET requestedUser = (
          FOR user IN users
            FILTER user.userName == ${userName}
            RETURN user
        )

        LET requestedUserOrgKeys = (
          FOR v, e IN 1 INBOUND requestedUser[0]._id affiliations
            RETURN v._key
        )

        RETURN (LENGTH(INTERSECTION(requestingUserOrgKeys, requestedUserOrgKeys)) > 0 ? true : false)
      `
    } catch (err) {
      console.error(
        `Database error when checking to see if user: ${userId} has admin permission for user: ${userName}, error: ${err}`,
      )
      throw new Error(i18n._(t`Permission error, not an admin for this user.`))
    }

    let isAdmin
    try {
      isAdmin = await cursor.next()
    } catch (err) {
      console.error(
        `Cursor error when checking to see if user: ${userId} has admin permission for user: ${userName}, error: ${err}`,
      )
      throw new Error(i18n._(t`Permission error, not an admin for this user.`))
    }

    return isAdmin
  }
}

module.exports = {
  checkUserIsAdminForUser,
}
