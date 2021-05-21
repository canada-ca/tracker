import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDkimByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH dkim
        FOR dkimScan IN dkim
          FILTER dkimScan._key IN ${keys} 
          RETURN MERGE({ id: dkimScan._key, _type: "dkim" }, dkimScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDkimByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find DKIM scan(s). Please try again.`))
    }

    const dkimMap = {}
    try {
      await cursor.forEach((dkimScan) => {
        dkimMap[dkimScan._key] = dkimScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDkimByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find DKIM scan(s). Please try again.`))
    }

    return keys.map((key) => dkimMap[key])
  })
