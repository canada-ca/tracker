const DataLoader = require('dataloader')

module.exports.dkimLoaderByKey = (query) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR dkimScan IN dkim
          FILTER ${keys}[** FILTER CURRENT == dkimScan._key]
          RETURN dkimScan
      `
    } catch (err) {
      console.error(
        `Database error occurred when running dkimLoaderByKey: ${err}`,
      )
      throw new Error('Unable to find dkim scan. Please try again.')
    }

    const dkimMap = {}
    try {
      await cursor.each((dkimScan) => {
        dkimMap[dkimScan._key] = dkimScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when running dkimLoaderByKey: ${err}`,
      )
      throw new Error('Unable to find dkim scan. Please try again.')
    }

    return keys.map((key) => dkimMap[key])
  })
