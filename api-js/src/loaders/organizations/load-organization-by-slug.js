const DataLoader = require('dataloader')

module.exports.orgLoaderBySlug = (query, language) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER ${slugs}[** FILTER (LOWER(CURRENT) == LOWER(TRANSLATE(${language}, org.orgDetails).slug))]
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, blueCheck: org.blueCheck }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(`Database error when running orgLoaderBySlug: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org.slug] = org
      })
    } catch (err) {
      console.error(`Cursor error during orgLoaderBySlug: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }

    return slugs.map((slug) => orgMap[slug])
  })
