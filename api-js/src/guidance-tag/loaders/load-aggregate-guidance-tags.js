import { t } from '@lingui/macro'
import DataLoader from 'dataloader'

export const loadAggregateGuidanceTagById = ({ query, userKey, i18n }) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        WITH aggregateGuidanceTags
        FOR tag IN aggregateGuidanceTags
          FILTER tag._key IN ${tags}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag"})
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadAggregateGuidanceTagById: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find Aggregate guidance tag(s). Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.forEach((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadAggregateGuidanceTagById: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find Aggregate guidance tag(s). Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })
