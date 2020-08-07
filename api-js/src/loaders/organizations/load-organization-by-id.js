const DataLoader = require('dataloader')

module.exports.orgLoaderById = (query) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER ${ids}[** FILTER CURRENT == org.key]
          RETURN org
      `
    } catch (err) {
      console.error(`Database error when running orgLoaderById: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org._key] = org
      })
    } catch (err) {
      console.error(`Cursor error during orgLoaderById: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    return ids.map((id) => orgMap[id])
  })
