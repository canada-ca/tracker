const DataLoader = require('dataloader')

module.exports.domainLoaderByKey = (query) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER ${ids}[** FILTER CURRENT == domain._key]
          RETURN domain
      `
    } catch (err) {
      console.error(
        `Database error occurred when running domainLoaderByKey: ${err}`,
      )
      throw new Error('Unable to find domain. Please try again.')
    }

    const domainMap = {}
    try {
      await cursor.each((domain) => {
        domainMap[domain._key] = domain
      })
    } catch (err) {
      console.error(`Cursor error occurred during domainLoaderByKey: ${err}`)
      throw new Error('Unable to find domain. Please try again.')
    }

    return ids.map((id) => domainMap[id])
  })
