const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.domainLoaderByDomain = (query, userKey, i18n) =>
  new DataLoader(async (domains) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER domain.domain IN ${domains}
          RETURN MERGE({ id: domain._key}, domain)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running domainLoaderByDomain: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find domain. Please try again.`))
    }

    const domainMap = {}
    try {
      await cursor.each((domain) => {
        domainMap[domain.domain] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running domainLoaderByDomain: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find domain. Please try again.`))
    }

    return domains.map((domain) => domainMap[domain])
  })
