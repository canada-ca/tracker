const getAllOrgKeys = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
        FOR org IN organizations
            RETURN org._key
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org ids: ${err}`)
  }

  let orgKeys
  try {
    orgKeys = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org ids: ${err}`)
  }

  return orgKeys
}

module.exports = {
  getAllOrgKeys,
}
