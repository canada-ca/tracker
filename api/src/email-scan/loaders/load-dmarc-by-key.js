import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDmarcByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH dmarc
        FOR dmarcScan IN dmarc
          FILTER dmarcScan._key IN ${keys}
          RETURN MERGE({ id: dmarcScan._key, _type: "dmarc" }, dmarcScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDmarcByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DMARC scan(s). Please try again.`),
      )
    }

    const dmarcMap = {}
    try {
      await cursor.forEach((dmarcScan) => {
        dmarcMap[dmarcScan._key] = dmarcScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDmarcByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DMARC scan(s). Please try again.`),
      )
    }
    return keys.map((key) => dmarcMap[key])
  })
