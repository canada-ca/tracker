const findDomainClaims = async ({ query, domainId }) => {
  let cursor
  try {
    cursor = await query`
        FOR v, e IN 1..1 ANY ${domainId} claims
            RETURN e
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find domain claims: ${err}`)
  }

  let claims
  try {
    claims = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find domain claims: ${err}`)
  }

  return claims
}

module.exports = {
  findDomainClaims,
}
