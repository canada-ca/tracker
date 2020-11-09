const DataLoader = require('dataloader')
const { t } = require('@lingui/macro')

module.exports.verifiedOrgLoaderBySlug = (query, language, i18n) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER TRANSLATE(${language}, org.orgDetails).slug IN ${slugs}
          FILTER org.verified == true
          LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, verified: org.verified, domainCount: COUNT(domains) }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(`Database error when running verifiedOrgLoaderBySlug: ${err}`)
      throw new Error(i18n._(t`Unable to find verified organization. Please try again.`))
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org.slug] = org
      })
    } catch (err) {
      console.error(`Cursor error during verifiedOrgLoaderBySlug: ${err}`)
      throw new Error(i18n._(t`Unable to find verified organization. Please try again.`))
    }

    return slugs.map((slug) => orgMap[slug])
  })
