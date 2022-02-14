import { t } from '@lingui/macro'

export const checkDomainPermission =
  ({ i18n, query, userKey, auth: { loginRequiredBool } }) =>
  async ({ domainId }) => {
    if (userKey === 'NO_USER' && !loginRequiredBool) {
      const domain = await query`
        RETURN DOCUMENT(${domainId})
      `
      return domain !== undefined
    }

    let userAffiliatedClaims, claim
    const userKeyString = `users/${userKey}`

    // Check to see if the user is a super admin
    let superAdminAffiliationCursor
    try {
      superAdminAffiliationCursor = await query`
      WITH affiliations, organizations, users
      FOR v, e IN 1..1 ANY ${userKeyString} affiliations
        FILTER e.permission == 'super_admin'
        RETURN e.from
    `
    } catch (err) {
      console.error(
        `Database error when retrieving super admin claims for user: ${userKey} and domain: ${domainId}: ${err}`,
      )
      throw new Error(
        i18n._(
          t`Permission check error. Unable to request domain information.`,
        ),
      )
    }

    if (superAdminAffiliationCursor.count > 0) {
      return true
    }

    // Retrieve user affiliations and affiliated organizations owning provided domain
    try {
      userAffiliatedClaims = await query`
      WITH affiliations, claims, domains, organizations, users
      LET userAffiliations = (FOR v, e IN 1..1 ANY ${userKeyString} affiliations RETURN e._from)
      LET domainClaims = (FOR v, e IN 1..1 ANY ${domainId} claims RETURN e._from)
      LET affiliatedClaims = INTERSECTION(userAffiliations, domainClaims)
        RETURN affiliatedClaims
    `
    } catch (err) {
      console.error(
        `Database error when retrieving affiliated organization claims for user: ${userKey} and domain: ${domainId}: ${err}`,
      )
      throw new Error(
        i18n._(
          t`Permission check error. Unable to request domain information.`,
        ),
      )
    }

    try {
      claim = await userAffiliatedClaims.next()
    } catch (err) {
      console.error(
        `Cursor error when retrieving affiliated organization claims for user: ${userKey} and domain: ${domainId}: ${err}`,
      )
      throw new Error(
        i18n._(
          t`Permission check error. Unable to request domain information.`,
        ),
      )
    }
    return claim[0] !== undefined
  }
