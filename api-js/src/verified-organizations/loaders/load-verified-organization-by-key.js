import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const verifiedOrgLoaderByKey = (query, language, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR org IN organizations
          FILTER org._key IN ${keys}
          FILTER org.verified == true
          LET domains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          RETURN MERGE({ _id: org._id, _key: org._key, id: org._key, _rev: org._rev, _type: "verifiedOrganization", verified: org.verified, domainCount: COUNT(domains), summaries: org.summaries }, TRANSLATE(${language}, org.orgDetails))
      `
    } catch (err) {
      console.error(
        `Database error when running verifiedOrgLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find verified organization. Please try again.`),
      )
    }

    const orgMap = {}
    try {
      await cursor.each((org) => {
        orgMap[org._key] = org
      })
    } catch (err) {
      console.error(
        `Cursor error occurred during verifiedOrgLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find verified organization. Please try again.`),
      )
    }

    return keys.map((id) => orgMap[id])
  })
