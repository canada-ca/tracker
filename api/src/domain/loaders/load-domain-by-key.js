import DataLoader from 'dataloader'
import {t} from '@lingui/macro'

export const loadDomainByKey = ({query, userKey, i18n}) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        WITH domains
        FOR domain IN domains
          FILTER domain._key IN ${ids}
          RETURN MERGE({ id: domain._key, _type: "domain" }, domain)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDomainByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain. Please try again.`))
    }

    const domainMap = {}
    try {
      await cursor.forEach((domain) => {
        domainMap[domain._key] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDomainByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain. Please try again.`))
    }

    return ids.map((id) => domainMap[id])
  })
