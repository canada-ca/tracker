import { t } from '@lingui/macro'
import DataLoader from 'dataloader'

export const loadAggregateGuidanceTagByTagId = ({
  query,
  userKey,
  i18n,
  language,
}) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        WITH aggregateGuidanceTags
        FOR tag IN aggregateGuidanceTags
          FILTER tag._key IN ${tags}
          RETURN MERGE(
            {
              _id: tag._id,
              _key: tag._key,
              _rev: tag._rev,
              _type: "guidanceTag",
              id: tag._key,
              tagId: tag._key
            },
            TRANSLATE(${language}, tag)
          )
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadAggregateGuidanceTagByTagId: ${err}`,
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
        `Cursor error occurred when user: ${userKey} running loadAggregateGuidanceTagByTagId: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find Aggregate guidance tag(s). Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })
