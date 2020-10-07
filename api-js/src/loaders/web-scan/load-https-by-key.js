const DataLoader = require('dataloader')

module.exports.httpsLoaderByKey = (query) =>
  new DataLoader(async (keys) => {
    let cursor
    try {
      cursor = await query`
        FOR httpsScan IN https
          FILTER ${keys}[** FILTER CURRENT == httpsScan._key]
          RETURN httpsScan
      `
    } catch (err) {
      console.error(`Database error occurred when running httpsLoaderByKey: ${err}`)
      throw new Error('Unable to find https scan. Please try again.')
    }

    const httpsMap = {}
    try {
      await cursor.each((httpsScan) => {
        httpsMap[httpsScan._key] = httpsScan
      })
    } catch (err) {
      console.error(`Cursor error occurred when running httpsLoaderByKey: ${err}`)
      throw new Error('Unable to find https scan. Please try again.')
    }

    return keys.map((key) => httpsMap[key])
  })