const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.httpsLoaderByKey = (query, userId, i18n) =>
  new DataLoader(async (keys) => {
    let cursor
    try {
      cursor = await query`
        FOR httpsScan IN https
          FILTER httpsScan._key IN ${keys}
          RETURN MERGE({ id: httpsScan._key }, httpsScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running httpsLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find https scan. Please try again.`))
    }

    const httpsMap = {}
    try {
      await cursor.each((httpsScan) => {
        httpsMap[httpsScan._key] = httpsScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userId} running httpsLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find https scan. Please try again.`))
    }

    return keys.map((key) => httpsMap[key])
  })
