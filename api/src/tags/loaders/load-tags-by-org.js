import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadTagsByOrg =
  ({ query, userKey, i18n, language }) =>
  async ({ orgId, includeGlobal, includePending, sortDirection }) => {
    let ownershipFilter = aql`FILTER ${orgId} IN tag.organizations`
    if (includeGlobal) {
      ownershipFilter = aql`${ownershipFilter} OR tag.ownership == "global"`
    }

    let pendingFilter = aql`FILTER tag.ownership != "pending"`
    if (includePending) {
      pendingFilter = aql``
    }

    let cursor
    try {
      cursor = await query`
        FOR tag IN tags
          ${ownershipFilter}
          ${pendingFilter}
          LET label = TRANSLATE(${language}, tag.label)
          SORT label ${sortDirection}
          RETURN {
            "tagId": tag.tagId,
            "label": label,
            "description": TRANSLATE(${language}, tag.description),
            "visible": tag.visible,
            "ownership": tag.ownership,
            "organizations": tag.organizations,
          }
      `
    } catch (err) {
      console.error(`Database error occurred while user: ${userKey} was trying to query tags in loadTagsByOrg, ${err}`)
      throw new Error(i18n._(t`Unable to load tag(s). Please try again.`))
    }

    let tagInfo
    try {
      tagInfo = await cursor.all()
    } catch (err) {
      console.error(`Cursor error occurred while user: ${userKey} was trying to gather tags in loadTagsByOrg, ${err}`)
      throw new Error(i18n._(t`Unable to load tag(s). Please try again.`))
    }

    return tagInfo
  }
