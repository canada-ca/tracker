const checkForSuperAdminOrg = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
      FOR org IN organizations
        FILTER org.orgDetails.en.acronym == 'SA'
        RETURN org
    `
  } catch (err) {
    throw new Error(
      `Database error occurred well trying to find super admin org: ${err}`,
    )
  }

  let org
  try {
    org = await cursor.next()
  } catch (err) {
    throw new Error(
      `Cursor error occurred well trying to find super admin org: ${err}`,
    )
  }

  return org
}

module.exports = {
    checkForSuperAdminOrg,
}
