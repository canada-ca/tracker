const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.sslLoaderByKey = (query, i18n) =>
  new DataLoader(async (keys) => {
    let cursor
    try {
      cursor = await query`
        FOR sslScan IN ssl
          FILTER ${keys}[** FILTER CURRENT == sslScan._key]
          RETURN sslScan
      `
    } catch (err) {
      console.error(
        `Database error occurred when running sslLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find ssl scan. Please try again.`))
    }

    const sslMap = {}
    try {
      await cursor.each((sslScan) => {
        sslMap[sslScan._key] = sslScan
      })
    } catch (err) {
      console.error(`Cursor error occurred when running sslLoaderByKey: ${err}`)
      throw new Error(i18n._(t`Unable to find ssl scan. Please try again.`))
    }

    return keys.map((key) => sslMap[key])
  })
