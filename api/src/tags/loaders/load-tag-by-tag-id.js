import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadTagByTagId = ({ query, userKey, i18n, language }) =>
  new DataLoader(async (tags) => {
    let cursor

    try {
      cursor = await query`
        WITH tags
        FOR tag IN tags
          FILTER tag.tagId IN ${tags}
          RETURN {
            _type: "tag",
            "tagId": tag.tagId,
            "label": TRANSLATE(${language}, tag.label),
            "description": TRANSLATE(${language}, tag.description),
            "visible": tag.visible,
            "ownership": tag.ownership,
          }
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadTagByTagId: ${err}`)
      throw new Error(i18n._(t`Unable to load tag(s). Please try again.`))
    }

    const tagMap = {}
    try {
      await cursor.forEach((tag) => {
        tagMap[tag.tagId] = tag
      })
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} during loadTagByTagId: ${err}`)
      throw new Error(i18n._(t`Unable to load tag(s). Please try again.`))
    }

    return tags.map((tag) => tagMap[tag])
  })
