import {t} from '@lingui/macro'

export const checkOrgOwner =
  ({i18n, query, userKey}) =>
    async ({orgId}) => {
      const userIdString = `users/${userKey}`

      // find affiliation
      let affiliationCursor
      try {
        affiliationCursor = await query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
          FILTER e._to == ${userIdString}
          RETURN e.owner
      `
      } catch (err) {
        console.error(
          `Database error when checking to see if user: ${userKey} is the owner of: ${orgId}: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to load owner information. Please try again.`),
        )
      }

      let isOrgOwner
      try {
        isOrgOwner = await affiliationCursor.next()
      } catch (err) {
        console.error(
          `Cursor error when checking to see if user: ${userKey} is the owner of: ${orgId}: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to load owner information. Please try again.`),
        )
      }

      return isOrgOwner
    }
