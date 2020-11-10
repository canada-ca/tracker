const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.spfLoaderByKey = (query, userId, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR spfScan IN spf
          FILTER spfScan._key IN ${keys} 
          RETURN spfScan
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running spfLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find spf scan. Please try again.`))
    }

    const spfMap = {}
    try {
      await cursor.each((spfScan) => {
        spfMap[spfScan._key] = spfScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userId} running spfLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find spf scan. Please try again.`))
    }

    return keys.map((key) => spfMap[key])
  })
