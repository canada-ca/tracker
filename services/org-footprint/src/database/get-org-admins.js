const getOrgAdmins = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER e.permission == "admin" OR e.permission == "owner"
            RETURN v
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org admins: ${err}`)
  }

  let orgAdmins
  try {
    orgAdmins = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org admins: ${err}`)
  }

  return orgAdmins
}

module.exports = {
  getOrgAdmins,
}
