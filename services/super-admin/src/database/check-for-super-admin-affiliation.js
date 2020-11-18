const checkForSuperAdminAffiliation = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
      FOR affiliation IN affiliations
        FILTER affiliation.defaultSA == true
        RETURN affiliation
    `
  } catch (err) {
    throw new Error(
      `Database error occurred well trying to find super admin affiliation: ${err}`,
    )
  }

  let affiliation
  try {
    affiliation = await cursor.next()
  } catch (err) {
    throw new Error(
      `Cursor error occurred well trying to find super admin affiliation: ${err}`,
    )
  }

  return affiliation
}

module.exports = {
  checkForSuperAdminAffiliation,
}
