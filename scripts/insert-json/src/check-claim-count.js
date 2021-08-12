const checkClaimCount = async ({ query, domainId }) => {
  console.info(`\t Checking domain claim count ...`)
  const claimCursor = await query`
    WITH claims, domains, organizations
    FOR v,e IN 1..1 ANY ${domainId} claims
      RETURN v
  `

  return claimCursor.count
}

module.exports = {
  checkClaimCount,
}
