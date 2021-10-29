import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDkimResultByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH dkimResults
        FOR dkimResult IN dkimResults
          FILTER dkimResult._key IN ${keys}
          RETURN MERGE({ id: dkimResult._key, _type: "dkimResult" }, dkimResult)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDkimResultByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DKIM result(s). Please try again.`),
      )
    }

    const dkimResultMap = {}
    try {
      await cursor.forEach((dkimResult) => {
        dkimResultMap[dkimResult._key] = dkimResult
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDkimResultByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DKIM result(s). Please try again.`),
      )
    }

    return keys.map((key) => dkimResultMap[key])
  })
