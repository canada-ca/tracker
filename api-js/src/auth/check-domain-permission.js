const checkDomainPermission = async (userId, domainId, query) => {

  let userAffiliatedClaims

  // Retrieve user affiliations and affiliated organizations owning provided domain
  try {
    userAffiliatedClaims = await query`
      LET userAffiliations = (FOR v, e IN 1 INBOUND ${userId} affiliations RETURN e._from)
      LET domainClaims = (FOR v, e IN 1..1 INBOUND ${domainId} claims RETURN e._from)
      LET affiliatedClaims = INTERSECTION(userAffiliations, domainClaims)
        RETURN affiliatedClaims
    `
  } catch (err) {
    console.error(
      `Database error when retrieving affiliated organization claims for user with ID ${userId} and domain with ID ${domainId}: ${err}`,
    )
    throw new Error('Authentication error. Please sign in again.')
  }

  if (userAffiliatedClaims.count() > 0) {
    return true
  } else {
    return false
  }
}

module.exports = {
  checkDomainPermission,
}
