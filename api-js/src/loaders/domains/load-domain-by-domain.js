const DataLoader = require('dataloader')

module.exports.domainLoaderByDomain = (query) =>
  new DataLoader(async (domains) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER ${domains}[** FILTER CURRENT == domain.domain]
          RETURN domain
      `
    } catch (err) {
      console.error(
        `Database error occurred when running domainLoaderByDomain: ${err}`,
      )
      throw new Error('Unable to find domain. Please try again.')
    }

    const domainMap = {}
    try {
      await cursor.each((domain) => {
        domainMap[domain.domain] = domain
      })
    } catch (err) {
      console.error(`Cursor error occurred during domainLoaderByDomain: ${err}`)
      throw new Error('Unable to find domain. Please try again.')
    }

    return domains.map((domain) => domainMap[domain])
  })
