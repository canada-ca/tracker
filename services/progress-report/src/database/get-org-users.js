const getOrgUsers = async ({ query, orgId }) => {
  let cursor
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER v.emailUpdateOptions.progressReport == true
            RETURN v
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org users: ${err}`)
  }

  let orgAdmins
  try {
    orgAdmins = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org users: ${err}`)
  }

  return orgAdmins
}

module.exports = {
  getOrgUsers,
}
