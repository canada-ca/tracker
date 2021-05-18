import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadVerifiedDomainsById = ({ query, i18n }) =>
  new DataLoader(async (domains) => {
    let cursor

    try {
      cursor = await query`
        WITH claims, domains, organizations
        FOR domain IN domains
          FILTER domain.domain IN ${domains}
          LET verifiedDomain = (LENGTH(
            FOR v, e IN INBOUND domain._id claims FILTER v.verified == true RETURN v._key
          ) > 0 ? true : false)
          FILTER verifiedDomain == true
          RETURN MERGE(domain, { id: domain._key, _type: "verifiedDomain" })
    `
    } catch (err) {
      console.error(
        `Database error occurred when running loadVerifiedDomainsById: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load verified domain(s). Please try again.`),
      )
    }

    const domainMap = {}
    try {
      await cursor.forEach((domain) => {
        domainMap[domain.domain] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred during loadVerifiedDomainsById: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load verified domain(s). Please try again.`),
      )
    }
    return domains.map((domain) => domainMap[domain])
  })
