import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDkimGuidanceTagByTagId = ({
  query,
  userKey,
  i18n,
  language,
}) =>
    async ({tags = []}) => {

    let cursor
    try {
      cursor = await query`
        WITH dkimGuidanceTags
        FOR tag IN dkimGuidanceTags
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
        `Database error occurred when user: ${userKey} running loadDkimGuidanceTagByTagId: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DKIM guidance tag(s). Please try again.`),
      )
    }

    const tagMap = {}
    try {
      await cursor.forEach((tag) => {
        tagMap[tag._key] = tag
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDkimGuidanceTagByTagId: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DKIM guidance tag(s). Please try again.`),
      )
    }

    return tags.map((tag) => tagMap[tag])
  }
