import { t } from '@lingui/macro'

export const checkDomainPermission =
  ({ i18n, query, userKey }) =>
  async ({ domainId }) => {
    let userAffiliatedClaims
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
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    if (superAdminAffiliationCursor.count > 0) {
      return true
    }

    // Retrieve user affiliations and affiliated organizations owning provided domain
    try {
      userAffiliatedClaims = await query`
        WITH domains, users, organizations
        LET userAffiliations = (
          FOR v, e IN 1..1 ANY ${userKeyString} affiliations
            FILTER e.permission != "pending"
            RETURN v
        )
        LET hasVerifiedOrgAffiliation = POSITION(userAffiliations[*].verified, true)
        LET domainOrgClaims = (
          FOR v, e IN 1..1 ANY ${domainId} claims
            RETURN v
        )
        LET domainBelongsToVerifiedOrg = POSITION(domainOrgClaims[*].verified, true)
        LET affiliatedClaims = INTERSECTION(userAffiliations, domainOrgClaims)
        RETURN (domainBelongsToVerifiedOrg && hasVerifiedOrgAffiliation) || LENGTH(affiliatedClaims) > 0
    `
    } catch (err) {
      console.error(
        `Database error when retrieving affiliated organization claims for user: ${userKey} and domain: ${domainId}: ${err}`,
      )
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    let affiliated
    try {
      affiliated = await userAffiliatedClaims.next()
    } catch (err) {
      console.error(
        `Cursor error when retrieving affiliated organization claims for user: ${userKey} and domain: ${domainId}: ${err}`,
      )
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    return affiliated
  }
