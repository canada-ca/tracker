import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadSpfByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH spf
        FOR spfScan IN spf
          FILTER spfScan._key IN ${keys} 
          RETURN MERGE({ id: spfScan._key, _type: "spf" }, spfScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadSpfByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find SPF scan(s). Please try again.`))
    }

    const spfMap = {}
    try {
      await cursor.forEach((spfScan) => {
        spfMap[spfScan._key] = spfScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadSpfByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find SPF scan(s). Please try again.`))
    }

    return keys.map((key) => spfMap[key])
  })
