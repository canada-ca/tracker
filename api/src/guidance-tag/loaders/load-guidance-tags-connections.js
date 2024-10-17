import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadGuidanceTagSummaryConnectionsByTagId =
  ({ query, userKey, i18n, language }) =>
  async ({ guidanceTags, orderBy }) => {
    const tagIds = Object.keys(guidanceTags)

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'tag-id') {
        sortByField = aql`tag._key ${orderBy.direction}`
      } else if (orderBy.field === 'tag-name') {
        sortByField = aql`TRANSLATE(${language}, tag).tagName ${orderBy.direction}`
      } else if (orderBy.field === 'guidance') {
        sortByField = aql`TRANSLATE(${language}, tag).guidance ${orderBy.direction}`
      } else if (orderBy.field === 'tag-count') {
        sortByField = aql`TRANSLATE(tag._key, tagSummaries) ${orderBy.direction}`
      }
    }

    let guidanceTagInfoCursor
    try {
      guidanceTagInfoCursor = await query`
      WITH guidanceTags
      LET tagSummaries = (${guidanceTags})
      LET retrievedGuidanceTags = (
        FOR tag IN guidanceTags
          FILTER tag._key IN ${tagIds}
          SORT ${sortByField}
          RETURN MERGE(
            {
              _id: tag._id,
              _key: tag._key,
              _rev: tag._rev,
              _type: "guidanceTag",
              id: tag._key,
              tagId: tag._key,
              count: TRANSLATE(tag._key, tagSummaries)
            },
            TRANSLATE(${language}, tag)
          )
      )
      RETURN {
        "guidanceTags": retrievedGuidanceTags,
        "totalCount": LENGTH(${tagIds}),
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather guidance tags in loadGuidanceTagConnectionsByTagId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load guidance tag(s). Please try again.`))
    }

    let guidanceTagInfo
    try {
      guidanceTagInfo = await guidanceTagInfoCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather guidance tags in loadGuidanceTagConnectionsByTagId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load guidance tag(s). Please try again.`))
    }

    if (guidanceTagInfo.guidanceTags.length === 0) {
      return {
        guidanceTags: [],
        totalCount: 0,
      }
    }

    return guidanceTagInfo
  }
