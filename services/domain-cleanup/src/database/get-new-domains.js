const getNewDomains = async ({ query, _log }) => {
  let cursor
  try {
    cursor = await query`
            FOR c IN claims
                FILTER 'new-nouveau' IN c.tags
                RETURN c
        `
  } catch (err) {
    throw new Error(`Database error occurred while trying to find new domains: ${err}`)
  }

  let newDomains
  try {
    newDomains = await cursor.all()
  } catch (err) {
    throw new Error(`Cursor error occurred while trying to find new domains: ${err}`)
  }

  return newDomains
}

module.exports = {
  getNewDomains,
}
