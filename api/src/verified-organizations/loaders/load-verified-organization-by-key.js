import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadVerifiedOrgByKey = ({ query, language, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH claims, domains, organizations
        FOR org IN organizations
          FILTER org._key IN ${keys}
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
      console.error(`Database error when running loadVerifiedOrgByKey: ${err}`)
      throw new Error(
        i18n._(t`Unable to find verified organization(s). Please try again.`),
      )
    }

    const orgMap = {}
    try {
      await cursor.forEach((org) => {
        orgMap[org._key] = org
      })
    } catch (err) {
      console.error(`Cursor error occurred during loadVerifiedOrgByKey: ${err}`)
      throw new Error(
        i18n._(t`Unable to find verified organization(s). Please try again.`),
      )
    }

    return keys.map((id) => orgMap[id])
  })
