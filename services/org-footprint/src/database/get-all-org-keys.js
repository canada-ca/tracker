const getAllOrgKeys = async ({ query }) => {
  let cursor
  try {
    cursor = await query`
        FOR org IN organizations
            // TODO: filter out super admin org
            RETURN org._key
    `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find org ids: ${err}`)
  }

  let orgIds
  try {
    orgIds = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find org ids: ${err}`)
  }

  return orgIds
}

module.exports = {
  getAllOrgKeys,
}
