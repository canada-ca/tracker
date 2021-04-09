import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadHttpsByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor
    try {
      cursor = await query`
        WITH https
        FOR httpsScan IN https
          FILTER httpsScan._key IN ${keys}
          RETURN MERGE({ id: httpsScan._key, _type: "https" }, httpsScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadHttpsByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find HTTPS scan(s). Please try again.`),
      )
    }

    const httpsMap = {}
    try {
      await cursor.forEach((httpsScan) => {
        httpsMap[httpsScan._key] = httpsScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadHttpsByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load HTTPS scan(s). Please try again.`),
      )
    }

    return keys.map((key) => httpsMap[key])
  })
