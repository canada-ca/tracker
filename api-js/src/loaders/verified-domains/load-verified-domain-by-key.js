const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.verifiedDomainLoaderByKey = (query, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER domain._key IN ${keys}
          LET verifiedDomain = (LENGTH(
            FOR v, e IN INBOUND domain._id claims FILTER v.verified == true RETURN v._key
          ) > 0 ? true : false)
          FILTER verifiedDomain == true
          RETURN MERGE(domain, { id: domain._key })
      `
    } catch (err) {
      console.error(
        `Database error occurred when running verifiedDomainLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find verified domain. Please try again.`),
      )
    }

    const domainMap = {}
    try {
      await cursor.each(async (domain) => {
        domainMap[domain._key] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred during verifiedDomainLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find verified domain. Please try again.`),
      )
    }

    return keys.map((id) => domainMap[id])
  })
