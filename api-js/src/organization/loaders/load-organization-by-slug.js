import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const orgLoaderBySlug = (query, language, userKey, i18n) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER TRANSLATE(${language}, org.orgDetails).slug IN ${slugs}
          LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          RETURN MERGE({ _id: org._id, _key: org._key, _rev: org._rev, _type: "organization", id: org._key, verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running orgLoaderBySlug: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load organization(s). Please try again.`),
      )
    }

    const orgMap = {}
    try {
      await cursor.forEach((org) => {
        orgMap[org.slug] = org
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running orgLoaderBySlug: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load organization(s). Please try again.`),
      )
    }

    return slugs.map((slug) => orgMap[slug])
  })
