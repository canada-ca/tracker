import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadVerifiedOrgBySlug = ({ query, language, i18n }) =>
  new DataLoader(async (slugs) => {
    let cursor

    try {
      cursor = await query`
        WITH claims, domains, organizations
        FOR org IN organizations
          FILTER TRANSLATE(${language}, org.orgDetails).slug IN ${slugs}
          FILTER org.verified == true
          LET orgDomains = (FOR v, e IN 1..1 OUTBOUND org._id claims RETURN e._to)
          RETURN MERGE(
            {
              _id: org._id,
              _key: org._key,
              id: org._key,
              _rev: org._rev,
              _type: "verifiedOrganization",
              verified: org.verified,
              domainCount: COUNT(orgDomains),
              summaries: org.summaries
            }, 
            TRANSLATE(${language}, org.orgDetails)
          )
      `
    } catch (err) {
      console.error(`Database error when running loadVerifiedOrgBySlug: ${err}`)
      throw new Error(
        i18n._(t`Unable to find verified organization(s). Please try again.`),
      )
    }

    const orgMap = {}
    try {
      await cursor.forEach((org) => {
        orgMap[org.slug] = org
      })
    } catch (err) {
      console.error(`Cursor error during loadVerifiedOrgBySlug: ${err}`)
      throw new Error(
        i18n._(t`Unable to find verified organization(s). Please try again.`),
      )
    }

    return slugs.map((slug) => orgMap[slug])
  })
