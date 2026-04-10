import {t} from '@lingui/macro'

export const checkSuperAdmin =
  ({i18n, userKey, query}) =>
    async () => {
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
        throw new Error(i18n._(t`Unable to check permission. Please try again.`))
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

      return typeof permission !== 'undefined'
    }
