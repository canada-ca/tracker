const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.domainLoaderByKey = (query, userId, i18n) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR domain IN domains
          FILTER domain._key IN ${ids}
          RETURN domain
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running domainLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find domain. Please try again.`))
    }

    const domainMap = {}
    try {
      await cursor.each((domain) => {
        domainMap[domain._key] = domain
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userId} running domainLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find domain. Please try again.`))
    }

    return ids.map((id) => domainMap[id])
  })
