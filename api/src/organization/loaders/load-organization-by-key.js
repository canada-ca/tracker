import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadOrgByKey = ({ query, language, userKey, i18n }) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        WITH claims, domains, organizations
        FOR org IN organizations
          FILTER org._key IN ${ids}
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
              summaries: org.summaries
            }, 
            TRANSLATE(${language}, org.orgDetails)
          )
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadOrgByKey: ${err}`)
      throw new Error(i18n._(t`Unable to load organization(s). Please try again.`))
    }

    const orgMap = {}
    try {
      await cursor.forEach((org) => {
        orgMap[org._key] = org
      })
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} during loadOrgByKey: ${err}`)
      throw new Error(i18n._(t`Unable to load organization(s). Please try again.`))
    }

    return ids.map((id) => orgMap[id])
  })
