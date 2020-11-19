const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.orgLoaderByKey = (query, language, userId, i18n) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER org._key IN ${ids}
          LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, id: org._key, verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userId} running orgLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find organization. Please try again.`))
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org._key] = org
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userId} during orgLoaderByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to find organization. Please try again.`))
    }

    return ids.map((id) => orgMap[id])
  })
