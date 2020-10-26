const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.dkimResultLoaderByKey = (query, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR dkimResult IN dkimResults
          FILTER ${keys}[** FILTER CURRENT == dkimResult._key]
          RETURN dkimResult
      `
    } catch (err) {
      console.error(
        `Database error occurred when running dkimResultLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dkim result. Please try again.`))
    }

    const dkimResultMap = {}
    try {
      await cursor.each((dkimResult) => {
        dkimResultMap[dkimResult._key] = dkimResult
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when running dkimResultLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dkim result. Please try again.`))
    }

    return keys.map((key) => dkimResultMap[key])
  })
