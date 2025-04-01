import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadAllTags =
  ({ query, userKey, i18n, language }) =>
  async ({ isVisible }) => {
    let visibleFilter = aql``
    if (isVisible) {
      visibleFilter = aql`FILTER tag.visible == true`
    }

    let cursor
    try {
      cursor = await query`
        FOR tag IN tags
          ${visibleFilter}
          LET label = TRANSLATE(${language}, tag.label)
          SORT label ASC
          RETURN {
            "tagId": tag.tagId,
            "label": label,
            "description": TRANSLATE(${language}, tag.description),
            "visible": tag.visible,
            "ownership": tag.ownership,
          }
      `
    } catch (err) {
      console.error(`Database error occurred while user: ${userKey} was trying to query tags in loadAllTags, ${err}`)
      throw new Error(i18n._(t`Unable to load tag(s). Please try again.`))
    }

    let tagInfo
    try {
      tagInfo = await cursor.all()
    } catch (err) {
      console.error(`Cursor error occurred while user: ${userKey} was trying to gather tags in loadAllTags, ${err}`)
      throw new Error(i18n._(t`Unable to load tag(s). Please try again.`))
    }

    return tagInfo
  }
