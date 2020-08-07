const DataLoader = require('dataloader')

module.exports.orgLoaderBySlug = (query) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER ${slugs}[** FILTER (LOWER(CURRENT) == LOWER(org.slugEN) || LOWER(CURRENT) == LOWER(org.slugFR))]
          RETURN org
      `
    } catch (err) {
      console.error(
        `Database error when running orgLoaderBySlug: ${err}`,
      )
      throw new Error('Unable to find organization. Please try again.')
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        if (slugs.includes(org.slugFR)) {
          orgMap[org.slugFR] = org
        } else {
          orgMap[org.slugEN] = org
        }
      })
    } catch (err) {
      console.error(`Cursor error during orgLoaderBySlug: ${err}`)
      throw new Error('Unable to find organization. Please try again.')
    }
    
    return slugs.map((slug) => orgMap[slug])
  })
