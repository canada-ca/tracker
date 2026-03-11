const getOrgOwner = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER e.permission == "owner"
            RETURN v
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org owner: ${err}`)
  }

  let owner
  try {
    owner = await cursor.next()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org owner: ${err}`)
  }

  return owner
}

module.exports = {
  getOrgOwner,
}
