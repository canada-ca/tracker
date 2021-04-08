import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadSslGuidanceTagByTagId = ({ query, userKey, i18n }) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        WITH sslGuidanceTags
        FOR tag IN sslGuidanceTags
          FILTER tag._key IN ${tags}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadSslGuidanceTagByTagId: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find SSL guidance tag(s). Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.forEach((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadSslGuidanceTagByTagId: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find SSL guidance tag(s). Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })
