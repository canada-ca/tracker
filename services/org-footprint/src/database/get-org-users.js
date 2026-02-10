const getOrgUsers = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER v.emailUpdateOptions.orgFootprint == true
            RETURN v
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org users: ${err}`)
  }

  let orgUsers
  try {
    orgUsers = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org users: ${err}`)
  }

  return orgUsers
}

module.exports = {
  getOrgUsers,
}
