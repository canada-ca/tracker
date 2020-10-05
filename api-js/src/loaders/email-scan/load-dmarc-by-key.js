const DataLoader = require('dataloader')

module.exports.dmarcLoaderByKey = (query) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR dmarcScan IN dmarc
          FILTER ${keys}[** FILTER CURRENT == dmarcScan._key]
          RETURN dmarcScan   
      `
    } catch (err) {
      console.error(
        `Database error occurred when running dmarcLoaderByKey: ${err}`,
      )
      throw new Error('Unable to find dmarc scan. Please try again.')
    }

    const dmarcMap = {}
    try {
      await cursor.each((dmarcScan) => {
        dmarcMap[dmarcScan._key] = dmarcScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when running dmarcLoaderByKey: ${err}`,
      )
      throw new Error('Unable to find dmarc scan. Please try again.')
    }
    return keys.map((key) => dmarcMap[key])
  })
