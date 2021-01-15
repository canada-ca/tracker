import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const httpsGuidanceTagLoader = (query, userKey, i18n) =>
  new DataLoader(async (tags) => {
    let cursor
    try {
      cursor = await query`
        FOR tag IN httpsGuidanceTags
          FILTER tag._key IN ${tags}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running httpsGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find https guidance tags. Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.each((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running httpsGuidanceTagLoader: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find https guidance tags. Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  })
