const DataLoader = require('dataloader')

module.exports.domainLoaderBySlug = (query) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER ${slugs}[** FILTER CURRENT == domain.slug]
          RETURN domain
      `
    } catch (err) {
      console.error(
        `Database error occurred when running domainLoaderBySlug: ${err}`,
      )
      throw new Error('Unable to find domain. Please try again.')
    }

    const domainMap = {}
    try {
      await cursor.each((domain) => {
        domainMap[domain.slug] = domain
      })
    } catch (err) {
      console.error(`Cursor error occurred during domainLoaderBySlug: ${err}`)
      throw new Error('Unable to find domain. Please try again.')
    }

    return slugs.map((slug) => domainMap[slug])
  })
