const DataLoader = require('dataloader')

module.exports.orgLoaderByKey = (query, language) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER ${ids}[** FILTER CURRENT == org._key]
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(`Database error when running orgLoaderByKey: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org._key] = org
      })
    } catch (err) {
      console.error(`Cursor error occurred during orgLoaderByKey: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    return ids.map((id) => orgMap[id])
  })
