import { t } from '@lingui/macro'

export const checkPermission = ({ i18n, userKey, query }) => async ({
  orgId,
}) => {
  let cursor
  const userKeyString = `users/${userKey}`
  // Check for super admin
  try {
    cursor = await query`
      WITH affiliations, organizations, users
      FOR v, e IN 1 INBOUND ${userKeyString} affiliations
        FILTER e.permission == "super_admin"
        RETURN e.permission
    `
  } catch (err) {
    console.error(
      `Database error when checking to see if user: ${userKeyString} has super admin permission: ${err}`,
    )
    throw new Error(i18n._(t`Authentication error. Please sign in.`))
  }

  let permission
  try {
    permission = await cursor.next()
  } catch (err) {
    console.error(
      `Cursor error when checking to see if user ${userKeyString} has super admin permission: ${err}`,
    )
    throw new Error(i18n._(t`Unable to check permission. Please try again.`))
  }

  if (permission === 'super_admin') {
    return permission
  } else {
    // Check for other permission level
    try {
      cursor = await query`
        WITH affiliations, organizations, users
        FOR v, e IN 1 INBOUND ${userKeyString} affiliations
          FILTER e._from == ${orgId}
          RETURN e.permission
      `
    } catch (err) {
      console.error(
        `Database error occurred when checking ${userKeyString}'s permission: ${err}`,
      )
      throw new Error(i18n._(t`Authentication error. Please sign in.`))
    }

    try {
      permission = await cursor.next()
    } catch (err) {
      console.error(
        `Cursor error when checking ${userKeyString}'s permission: ${err}`,
      )
      throw new Error(i18n._(t`Unable to check permission. Please try again.`))
    }
    return permission
  }
}
