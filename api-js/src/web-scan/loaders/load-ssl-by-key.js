import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadSslByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor
    try {
      cursor = await query`
        WITH ssl
        FOR sslScan IN ssl
          FILTER sslScan._key IN ${keys}
          RETURN MERGE({ id: sslScan._key, _type: "ssl" }, sslScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadSslByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find SSL scan(s). Please try again.`))
    }

    const sslMap = {}
    try {
      await cursor.forEach((sslScan) => {
        sslMap[sslScan._key] = sslScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadSslByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find SSL scan(s). Please try again.`))
    }

    return keys.map((key) => sslMap[key])
  })
