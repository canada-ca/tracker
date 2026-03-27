import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadOrgOwnerByOrgId = ({ query, userKey, i18n }) =>
  new DataLoader(async (orgIds) => {
    const userIdString = `users/${userKey}`

    let cursor
    try {
      cursor = await query`
        WITH affiliations, organizations, users
        LET userId = ${userIdString}
        FOR orgId IN ${orgIds}
          LET isOwner = FIRST(
            FOR v, e IN 1..1 OUTBOUND orgId affiliations
              FILTER e._to == userId
              RETURN e.permission == "owner"
          )
          RETURN { orgId: orgId, isOwner: isOwner == true }
      `
    } catch (err) {
      console.error(`Database error when checking org ownership for user: ${userKey}: ${err}`)
      throw new Error(i18n._(t`Unable to load owner information. Please try again.`))
    }

    const ownerMap = {}
    try {
      await cursor.forEach(({ orgId, isOwner }) => {
        ownerMap[orgId] = isOwner
      })
    } catch (err) {
      console.error(`Cursor error when checking org ownership for user: ${userKey}: ${err}`)
      throw new Error(i18n._(t`Unable to load owner information. Please try again.`))
    }

    return orgIds.map((id) => ownerMap[id] ?? false)
  })
