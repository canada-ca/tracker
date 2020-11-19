const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.dmarcLoaderByKey = (query, userId, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR dmarcScan IN dmarc
          FILTER dmarcScan._key IN ${keys}
          RETURN MERGE({ id: dmarcScan._key }, dmarcScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running dmarcLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dmarc scan. Please try again.`))
    }

    const dmarcMap = {}
    try {
      await cursor.each((dmarcScan) => {
        dmarcMap[dmarcScan._key] = dmarcScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userId} running dmarcLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dmarc scan. Please try again.`))
    }
    return keys.map((key) => dmarcMap[key])
  })
