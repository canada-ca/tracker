import DataLoader from 'dataloader'
import {t} from '@lingui/macro'

export const loadDomainByDomain = ({query, userKey, i18n}) =>
  new DataLoader(async (domains) => {
    let cursor

    try {
      cursor = await query`
        WITH domains
        FOR domain IN domains
          FILTER domain.domain IN ${domains}
          RETURN MERGE({ id: domain._key, _type: "domain" }, domain)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDomainByDomain: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain. Please try again.`))
    }

    const domainMap = {}
    try {
      await cursor.forEach((domain) => {
        domainMap[domain.domain] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDomainByDomain: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load domain. Please try again.`))
    }

    return domains.map((domain) => domainMap[domain])
  })
