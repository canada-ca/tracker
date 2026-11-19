/**
 * Gets the English and French names of one organization.
 * @param {{query: Function, orgKey: string}} params - Tagged-template query function and organization key.
 * @returns {Promise<{en: string, fr: string}|undefined>} The names, or undefined when the org does not exist.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
const getBilingualOrgNames = async ({ query, orgKey }) => {
  let cursor
  try {
    cursor = await query`
        FOR org IN organizations
            FILTER org._key == ${orgKey}
            RETURN { "en": org.orgDetails.en.name, "fr": org.orgDetails.fr.name }
    `
  } catch (err) {
    throw new Error('Database error occurred while trying to find org names', { cause: err })
  }

  let orgNames
  try {
    orgNames = await cursor.next()
  } catch (err) {
    throw new Error('Cursor error occurred while trying to find org names', { cause: err })
  }

  return orgNames
}

module.exports = {
  getBilingualOrgNames,
}
