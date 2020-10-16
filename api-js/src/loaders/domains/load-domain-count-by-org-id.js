const domainLoaderCountByOrgId = (query, userId) => async ({
  orgId,
}) => {

  const userDBId = `users/${userId}`

  let domainsCursor
  try {
    domainsCursor = await query`
    LET superAdmin = (True IN (FOR v, e IN 1 INBOUND ${userDBId} affiliations FILTER e.permission == "super_admin" RETURN True) ? True : False)
    LET affiliated = (True IN (FOR v, e IN 1..1 INBOUND ${userDBId} affiliations FILTER v._id == ${orgId} RETURN True) ? True : False)
    LET domainCounter = (superAdmin || affiliated ? (FOR v, e IN 1..1 OUTBOUND ${orgId} claims RETURN True) : null)
    FOR domain in domainCounter return domain
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to query affiliated domains in loadDomainCountByOrgId.`,
    )
    throw new Error(
      'Database error occurred while querying domains. Please try again.',
    )
  }
  return domainsCursor.count
}

module.exports = {
  domainLoaderCountByOrgId,
}
