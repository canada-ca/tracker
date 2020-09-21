const checkDomainPermission = async (userId, domainId, query) => {
  let userAffiliatedClaims, claim

  // Retrieve user affiliations and affiliated organizations owning provided domain
  try {
    userAffiliatedClaims = await query`
      LET userAffiliations = (FOR v, e IN 1..1 ANY ${userId} affiliations RETURN e._from)
      LET domainClaims = (FOR v, e IN 1..1 ANY ${domainId} claims RETURN e._from)
      LET affiliatedClaims = INTERSECTION(userAffiliations, domainClaims)
        RETURN affiliatedClaims
    `
  } catch (err) {
    console.error(
      `Error when retrieving affiliated organization claims for user with ID ${userId} and domain with ID ${domainId}: ${err}`,
    )
    throw new Error('Authentication error. Please sign in again.')
  }

  try {
    claim = await userAffiliatedClaims.next()
  } catch (err) {
    console.error(
      `Error when retrieving affiliated organization claims for user with ID ${userId} and domain with ID ${domainId}: ${err}`,
    )
    throw new Error('Unable to find domain. Please try again.')
  }
  return claim[0] !== undefined
}

module.exports = {
  checkDomainPermission,
}
