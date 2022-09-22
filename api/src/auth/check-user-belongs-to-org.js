import {t} from '@lingui/macro'

export const checkUserBelongsToOrg =
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
          RETURN e
      `
      } catch (err) {
        console.error(
          `Database error when checking to see if user: ${userKey} belongs to org: ${orgId}: ${err}`,
        )
        throw new Error(
          i18n._(t`Unable to load affiliation information. Please try again.`),
        )
      }

      return affiliationCursor.count > 0
    }
