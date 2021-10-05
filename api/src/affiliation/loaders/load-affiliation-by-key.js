import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadAffiliationByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (ids) => {
    let cursor

    try {
      cursor = await query`
        WITH affiliations, organizations, users
        FOR affiliation IN affiliations
          FILTER affiliation._key IN ${ids}
          LET orgKey = PARSE_IDENTIFIER(affiliation._from).key
          LET userKey = PARSE_IDENTIFIER(affiliation._to).key
          RETURN MERGE(affiliation, { id: affiliation._key, orgKey: orgKey, userKey: userKey, _type: "affiliation" })
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadAffiliationByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find user affiliation(s). Please try again.`),
      )
    }

    const affiliationMap = {}
    try {
      await cursor.forEach((affiliation) => {
        affiliationMap[affiliation._key] = affiliation
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadAffiliationByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find user affiliation(s). Please try again.`),
      )
    }

    return ids.map((id) => affiliationMap[id])
  })
