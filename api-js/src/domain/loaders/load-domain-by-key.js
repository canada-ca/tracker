import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const domainLoaderByKey = (query, userKey, i18n) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER domain._key IN ${ids}
          RETURN MERGE({ id: domain._key, _type: "domain" }, domain)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running domainLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find domain. Please try again.`))
    }

    const domainMap = {}
    try {
      await cursor.forEach((domain) => {
        domainMap[domain._key] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running domainLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find domain. Please try again.`))
    }

    return ids.map((id) => domainMap[id])
  })
