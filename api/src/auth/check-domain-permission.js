import { t } from '@lingui/macro'

export const checkDomainPermission =
  ({ i18n, query, userKey }) =>
  async ({ domainId }) => {
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
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    if (superAdminAffiliationCursor.count > 0) {
      return true
    }

    // Retrieve user affiliations and affiliated organizations owning provided domain
    try {
      userAffiliatedClaims = await query`
        WITH domains, users, organizations
        FOR v, e IN 1..1 ANY "users/4239843" affiliations
          FILTER e.permission != "pending"
          FOR domainV, domainE IN 1..1 ANY v claims
            RETURN domainV
    `
    } catch (err) {
      console.error(
        `Database error when retrieving affiliated organization claims for user: ${userKey} and domain: ${domainId}: ${err}`,
      )
      throw new Error(i18n._(t`Permission check error. Unable to request domain information.`))
    }

    return userAffiliatedClaims.count > 0
  }
