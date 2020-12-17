const { t } = require('@lingui/macro')

const checkDomainPermission = ({ i18n, query, userKey }) => async ({
  domainId,
}) => {
  let userAffiliatedClaims, claim
  const userKeyString = `users/${userKey}`

  // Check to see if the user is a super admin
  let superAdminAffiliationCursor
  try {
    superAdminAffiliationCursor = await query`
      FOR v, e IN 1..1 ANY ${userKeyString} affiliations 
        FILTER e.permission == 'super_admin' 
        RETURN e.from
    `
  } catch (err) {
    console.error(
      `Database error when retrieving super admin claims for user: ${userKeyString} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Permission check error. Unable to request domain information.`),
    )
  }

  if (superAdminAffiliationCursor.count > 0) {
    return true
  }

  // Retrieve user affiliations and affiliated organizations owning provided domain
  try {
    userAffiliatedClaims = await query`
      LET userAffiliations = (FOR v, e IN 1..1 ANY ${userKeyString} affiliations RETURN e._from)
      LET domainClaims = (FOR v, e IN 1..1 ANY ${domainId} claims RETURN e._from)
      LET affiliatedClaims = INTERSECTION(userAffiliations, domainClaims)
        RETURN affiliatedClaims
    `
  } catch (err) {
    console.error(
      `Database error when retrieving affiliated organization claims for user: ${userKeyString} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Permission check error. Unable to request domain information.`),
    )
  }

  try {
    claim = await userAffiliatedClaims.next()
  } catch (err) {
    console.error(
      `Cursor error when retrieving affiliated organization claims for user: ${userKeyString} and domain: ${domainId}: ${err}`,
    )
    throw new Error(
      i18n._(t`Permission check error. Unable to request domain information.`),
    )
  }
  return claim[0] !== undefined
}

module.exports = {
  checkDomainPermission,
}
