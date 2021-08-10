const createClaim = async ({ trx, query, domainId, orgId }) => {
  console.info(`\tAdding claim`)
  
  const claimCursor = await trx.step(
    () => query`
      WITH domains, claims, organizations
      INSERT {
        _to: ${domainId},
        _from: ${orgId}
      } INTO claims
      RETURN NEW
    `,
  )

  const savedClaim = claimCursor.next()

  return savedClaim
}

module.exports = {
  createClaim,
}
