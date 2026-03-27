import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadPermissionByOrgId = ({ query, userKey, i18n }) =>
  new DataLoader(async (orgIds) => {
    const userKeyString = `users/${userKey}`

    // Check for super admin once for the whole batch
    let superAdminCursor
    try {
      superAdminCursor = await query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 INBOUND ${userKeyString} affiliations
          FILTER e.permission == "super_admin"
          RETURN e.permission
      `
    } catch (err) {
      console.error(`Database error when checking super admin permission for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Authentication error. Please sign in.`))
    }

    let superAdminPermission
    try {
      superAdminPermission = await superAdminCursor.next()
    } catch (err) {
      console.error(`Cursor error when checking super admin permission for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Unable to check permission. Please try again.`))
    }

    if (superAdminPermission === 'super_admin') {
      return orgIds.map(() => 'super_admin')
    }

    // Batch permission check across all org IDs in one query
    let cursor
    try {
      cursor = await query`
        WITH affiliations, organizations, users
        LET userAffiliations = (
          FOR v, e IN 1..1 ANY ${userKeyString} affiliations
            FILTER e.permission != "pending"
            RETURN v
        )
        LET hasVerifiedOrgAffiliation = POSITION(userAffiliations[*].verified, true)
        FOR orgId IN ${orgIds}
          LET org = DOCUMENT(orgId)
          LET orgIsVerified = org.verified
          LET userOrgAffiliation = FIRST(
            FOR v, e IN 1..1 ANY ${userKeyString} affiliations
              FILTER e._from == orgId
              RETURN e
          )
          RETURN {
            orgId: orgId,
            permission: userOrgAffiliation.permission IN ["user", "admin", "owner", "super_admin"] ? userOrgAffiliation.permission
              : (orgIsVerified && hasVerifiedOrgAffiliation) ? "user"
              : userOrgAffiliation.permission == "pending" ? userOrgAffiliation
              : null
          }
      `
    } catch (err) {
      console.error(`Database error when checking permissions for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Authentication error. Please sign in.`))
    }

    const permMap = {}
    try {
      await cursor.forEach(({ orgId, permission }) => {
        permMap[orgId] = permission
      })
    } catch (err) {
      console.error(`Cursor error when checking permissions for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Unable to check permission. Please try again.`))
    }

    return orgIds.map((id) => permMap[id] ?? null)
  })
