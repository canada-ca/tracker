import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const sslLoaderByKey = (query, userKey, i18n) =>
  new DataLoader(async (keys) => {
    let cursor
    try {
      cursor = await query`
        FOR sslScan IN ssl
          FILTER sslScan._key IN ${keys}
          RETURN MERGE({ id: sslScan._key }, sslScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running sslLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find ssl scan. Please try again.`))
    }

    const sslMap = {}
    try {
      await cursor.each((sslScan) => {
        sslMap[sslScan._key] = sslScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running sslLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find ssl scan. Please try again.`))
    }

    return keys.map((key) => sslMap[key])
  })
