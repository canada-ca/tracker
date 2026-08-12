import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDomainPermissionByDomainId = ({ query, userKey, i18n }) =>
  new DataLoader(async (domainIds) => {
    const userKeyString = `users/${userKey}`

    // Check super admin once for the whole batch (mirrors existing checkDomainPermission logic)
    let superAdminCursor
    try {
      superAdminCursor = await query`
        WITH affiliations, organizations, users
        FOR v, e IN 1..1 ANY ${userKeyString} affiliations
          FILTER e.permission == 'super_admin'
          RETURN e._from
      `
    } catch (err) {
      console.error(`Database error when checking super admin permission for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    if (superAdminCursor.count > 0) {
      return domainIds.map(() => true)
    }

    // Batch domain permission check across all domain IDs in one query
    let cursor
    try {
      cursor = await query`
        WITH affiliations, claims, domains, organizations, users
        LET userAffiliations = (
          FOR v, e IN 1..1 ANY ${userKeyString} affiliations
            FILTER e.permission != "pending"
            RETURN v
        )
        LET hasVerifiedOrgAffiliation = POSITION(userAffiliations[*].verified, true)
        FOR domainId IN ${domainIds}
          LET domainOrgClaims = (
            FOR v, e IN 1..1 ANY domainId claims
              RETURN v
          )
          LET domainBelongsToVerifiedOrg = POSITION(domainOrgClaims[*].verified, true)
          LET affiliatedClaims = INTERSECTION(userAffiliations, domainOrgClaims)
          RETURN {
            domainId: domainId,
            permitted: (domainBelongsToVerifiedOrg && hasVerifiedOrgAffiliation) || LENGTH(affiliatedClaims) > 0
          }
      `
    } catch (err) {
      console.error(`Database error when checking domain permissions for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    const permMap = {}
    try {
      await cursor.forEach(({ domainId, permitted }) => {
        permMap[domainId] = permitted
      })
    } catch (err) {
      console.error(`Cursor error when checking domain permissions for user: ${userKeyString}: ${err}`)
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    return domainIds.map((id) => permMap[id] ?? false)
  })
