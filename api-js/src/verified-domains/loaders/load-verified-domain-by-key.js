import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadVerifiedDomainByKey = ({ query, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
          WITH claims, domains, organizations
          FOR domain IN domains
            FILTER domain._key IN ${keys}
            LET verifiedDomain = (LENGTH(
              FOR v, e IN INBOUND domain._id claims FILTER v.verified == true RETURN v._key
            ) > 0 ? true : false)
            FILTER verifiedDomain == true
            RETURN MERGE(domain, { id: domain._key, _type: "verifiedDomain" })
      `
    } catch (err) {
      console.error(
        `Database error occurred when running loadVerifiedDomainByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load verified domain(s). Please try again.`),
      )
    }

    const domainMap = {}
    try {
      await cursor.forEach(async (domain) => {
        domainMap[domain._key] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred during loadVerifiedDomainByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load verified domain(s). Please try again.`),
      )
    }

    return keys.map((id) => domainMap[id])
  })
