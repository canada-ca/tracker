import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const dkimLoaderByKey = (query, userKey, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR dkimScan IN dkim
          FILTER dkimScan._key IN ${keys} 
          RETURN MERGE({ id: dkimScan._key, _type: "dkim" }, dkimScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running dkimLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dkim scan. Please try again.`))
    }

    const dkimMap = {}
    try {
      await cursor.each((dkimScan) => {
        dkimMap[dkimScan._key] = dkimScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running dkimLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find dkim scan. Please try again.`))
    }

    return keys.map((key) => dkimMap[key])
  })
