const checkClaim = async ({ query, domainId, orgId }) => {
  console.info(`\t Checking domain claims ...`)
  return await (
    await query`
    WITH claims, domains, organizations
    FOR v,e IN 1..1 ANY ${domainId} claims
    FILTER v._id == ${orgId}
      RETURN v
  `
  ).next()
}

module.exports = {
  checkClaim,
}
