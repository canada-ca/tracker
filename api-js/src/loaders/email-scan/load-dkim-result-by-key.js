const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.dkimResultLoaderByKey = (query, userId, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR dkimResult IN dkimResults
          FILTER dkimResult._key IN ${keys}
          RETURN MERGE({ id: dkimResult._key }, dkimResult)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running dkimResultLoaderByKey: ${err}`,
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
        `Cursor error occurred when user: ${userId} running dkimResultLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dkim result. Please try again.`))
    }

    return keys.map((key) => dkimResultMap[key])
  })
