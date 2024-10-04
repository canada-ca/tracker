const findUnclaimedDomains = async ({ query, orgId }) => {
  // get domains in unclaimed org
  let cursor
  try {
    cursor = await query`
    FOR v, e IN 1..1 ANY ${orgId} claims
        RETURN v
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find unclaimed domains: ${err}`)
  }

  let unclaimedDomains
  try {
    unclaimedDomains = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find unclaimed domains: ${err}`)
  }

  return unclaimedDomains
}

module.exports = {
  findUnclaimedDomains,
}
