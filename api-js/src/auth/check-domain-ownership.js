const checkDomainOwnership = async ({ userId, domainId, query }) => {
  let userAffiliatedOwnership, ownership

  // Get user affiliations and affiliated orgs owning provided domain
  try {
    userAffiliatedOwnership = await query`
      LET userAffiliations = (FOR v, e IN 1..1 ANY ${userId} affiliations RETURN e._from)
      LET domainOwnerships = (FOR v, e IN 1..1 ANY ${domainId} ownership RETURN e._from)
      LET affiliatedOwnership = INTERSECTION(userAffiliations, domainOwnerships)
        RETURN affiliatedOwnership
    `
  } catch (err) {
    console.error(`Database error when retrieving affiliated organization ownership for user: ${userId} and the domain: ${domainId}: ${err}`)
    throw new Error('Error when retrieving dmarc report information. Please try again.')
  }

  try {
    ownership = await userAffiliatedOwnership.next()
  } catch (err) {
    console.error(`Cursor error when retrieving affiliated organization ownership for user: ${userId} and the domain: ${domainId}: ${err}`)
    throw new Error('Error when retrieving dmarc report information. Please try again.')
  }

  return ownership[0] !== undefined
}

module.exports = {
  checkDomainOwnership,
}