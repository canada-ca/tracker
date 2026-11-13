/**
 * Lists the keys of all organizations.
 * @param {{query: Function}} params - Tagged-template query function.
 * @returns {Promise<string[]>} Organization keys.
 * @throws {Error} If the query or cursor read fails. The original error is set as `cause`.
 */
const getAllOrgKeys = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
        FOR org IN organizations
            RETURN org._key
    `
  } catch (err) {
    throw new Error('Database error occurred while trying to find org keys', { cause: err })
  }

  let orgKeys
  try {
    orgKeys = await cursor.all()
  } catch (err) {
    throw new Error('Cursor error occurred while trying to find org keys', { cause: err })
  }

  return orgKeys
}

module.exports = {
  getAllOrgKeys,
}
