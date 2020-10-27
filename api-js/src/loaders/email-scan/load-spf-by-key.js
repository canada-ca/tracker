const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.spfLoaderByKey = (query, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR spfScan IN spf
          FILTER ${keys}[** FILTER CURRENT == spfScan._key]
          RETURN spfScan
      `
    } catch (err) {
      console.error(
        `Database error occurred when running spfLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find spf scan. Please try again.`))
    }

    const spfMap = {}
    try {
      await cursor.each((spfScan) => {
        spfMap[spfScan._key] = spfScan
      })
    } catch (err) {
      console.error(`Cursor error occurred when running spfLoaderByKey: ${err}`)
      throw new Error(i18n._(t`Unable to find spf scan. Please try again.`))
    }

    return keys.map((key) => spfMap[key])
  })
