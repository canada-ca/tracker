import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadOrgBySlug = ({ query, language, userKey, i18n }) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        WITH claims, domains, organizations
        FOR org IN organizations
          FILTER org.orgDetails.en.slug IN ${slugs}
          OR org.orgDetails.fr.slug IN ${slugs}
          LET orgDomains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          RETURN MERGE(
            {
              _id: org._id,
              _key: org._key,
              _rev: org._rev,
              _type: "organization",
              id: org._key,
              verified: org.verified,
              externalId: org.externalId,
              domainCount: COUNT(orgDomains),
              summaries: org.summaries,
              slugEN: org.orgDetails.en.slug,
              slugFR: org.orgDetails.fr.slug
            },
            TRANSLATE(${language}, org.orgDetails)
          )
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrgBySlug: ${err}`)
      throw new Error(i18n._(t`Unable to load organization(s). Please try again.`))
    }

    const orgMap = {}
    try {
      await cursor.forEach((org) => {
        orgMap[org.slugEN] = org
        orgMap[org.slugFR] = org
      })
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} running loadOrgBySlug: ${err}`)
      throw new Error(i18n._(t`Unable to load organization(s). Please try again.`))
    }

    return slugs.map((slug) => orgMap[slug])
  })
