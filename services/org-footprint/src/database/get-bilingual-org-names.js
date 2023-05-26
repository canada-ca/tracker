const getBilingualOrgNames = async ({ query, orgKey }) => {
  let cursor
  try {
    cursor = await query`
        FOR org IN organizations
            FILTER org._key == ${orgKey}
            RETURN { "en": org.orgDetails.en.name, "fr": org.orgDetails.fr.name }
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org names: ${err}`)
  }

  let orgNames
  try {
    orgNames = await cursor.next()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org names: ${err}`)
  }

  return orgNames
}

module.exports = {
  getBilingualOrgNames,
}
