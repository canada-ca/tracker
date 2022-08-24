import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDnsByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH dns
        FOR dnsScan IN dns
          FILTER dnsScan._key IN ${keys}
          RETURN MERGE({ id: dnsScan._key, _type: "dns" }, dnsScan)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDnsByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DNS scan(s). Please try again.`),
      )
    }

    const dnsMap = {}
    try {
      await cursor.forEach((dnsScan) => {
        dnsMap[dnsScan._key] = dnsScan
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDnsByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DNS scan(s). Please try again.`),
      )
    }
    return keys.map((key) => dnsMap[key])
  })
