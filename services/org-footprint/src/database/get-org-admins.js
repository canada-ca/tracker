const getOrgAdmins = async ({ query, orgKey }) => {
  let cursor
  const orgId = `organizations/${orgKey}`
  try {
    cursor = await query`
        FOR v, e IN 1..1 OUTBOUND ${orgId} affiliations
            FILTER e.permission == "admin"
            // TODO: filter out users who have opted out of emails  
            RETURN { email: v.userName, language: v.preferredLang }
    `
  } catch (err) {
    throw new Error(`Database error occurred well trying to find org admins: ${err}`)
  }

  let orgAdmins
  try {
    orgAdmins = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred well trying to find org admins: ${err}`)
  }

  return orgAdmins
}

module.exports = {
  getOrgAdmins,
}
