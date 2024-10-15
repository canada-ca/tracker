import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadGuidanceTagSummaryConnectionsByTagId =
  ({ query, userKey, cleanseInput, i18n, language }) =>
  async ({ guidanceTags, after, before, first, last, orderBy }) => {
    const tagIds = Object.keys(guidanceTags)

    let afterTemplate = aql``
    let afterVar = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(${afterId}, "[a-z]+")[1])`
      } else {
        let afterTemplateDirection
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        afterVar = aql`LET afterVar = DOCUMENT(guidanceTags, ${afterId})`

        let tagField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'tag-id') {
          tagField = aql`tag._key`
          documentField = aql`afterVar._key`
        } else if (orderBy.field === 'tag-name') {
          tagField = aql`TRANSLATE(${language}, tag).tagName`
          documentField = aql`TRANSLATE(${language}, afterVar).tagName`
        } else if (orderBy.field === 'guidance') {
          tagField = aql`TRANSLATE(${language}, tag).guidance`
          documentField = aql`TRANSLATE(${language}, afterVar).guidance`
        } else if (orderBy.field === 'tag-count') {
          tagField = aql`TRANSLATE(tag._key, tagSummaries)`
          documentField = aql`TRANSLATE(afterVar._key, tagSummaries)`
        }

        afterTemplate = aql`
        FILTER ${tagField} ${afterTemplateDirection} ${documentField}
        OR (${tagField} == ${documentField}
        AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(${afterId}, "[a-z]+")[1]))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(${beforeId}, "[a-z]+")[1])`
      } else {
        let beforeTemplateDirection
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        beforeVar = aql`LET beforeVar = DOCUMENT(guidanceTags, ${beforeId})`

        let tagField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'tag-id') {
          tagField = aql`tag._key`
          documentField = aql`beforeVar._key`
        } else if (orderBy.field === 'tag-name') {
          tagField = aql`TRANSLATE(${language}, tag).tagName`
          documentField = aql`TRANSLATE(${language}, beforeVar).tagName`
        } else if (orderBy.field === 'guidance') {
          tagField = aql`TRANSLATE(${language}, tag).guidance`
          documentField = aql`TRANSLATE(${language}, beforeVar).guidance`
        } else if (orderBy.field === 'tag-count') {
          tagField = aql`TRANSLATE(tag._key, tagSummaries)`
          documentField = aql`TRANSLATE(beforeVar._key, tagSummaries)`
        }

        beforeTemplate = aql`
        FILTER ${tagField} ${beforeTemplateDirection} ${documentField}
        OR (${tagField} == ${documentField}
        AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(${beforeId}, "[a-z]+")[1]))
      `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadGuidanceTagConnectionsByTagId.`,
      )
      throw new Error(
        i18n._(t`You must provide a \`first\` or \`last\` value to properly paginate the \`GuidanceTag\` connection.`),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadGuidanceTagConnectionsByTagId.`,
      )
      throw new Error(
        i18n._(t`Passing both \`first\` and \`last\` to paginate the \`GuidanceTag\` connection is not supported.`),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadGuidanceTagConnectionsByTagId.`,
        )
        throw new Error(i18n._(t`\`${argSet}\` on the \`GuidanceTag\` connection cannot be less than zero.`))
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadGuidanceTagConnectionsByTagId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`GuidanceTag\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadGuidanceTagConnectionsByTagId.`,
      )
      throw new Error(i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`))
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedGuidanceTags)._key, "[a-z]+")[1])`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedGuidanceTags)._key, "[a-z]+")[1])`
    if (typeof orderBy !== 'undefined') {
      let hasNextPageDirection
      let hasPreviousPageDirection
      if (orderBy.direction === 'ASC') {
        hasNextPageDirection = aql`>`
        hasPreviousPageDirection = aql`<`
      } else {
        hasNextPageDirection = aql`<`
        hasPreviousPageDirection = aql`>`
      }

      let tagField, hasNextPageDocument, hasPreviousPageDocument
      /* istanbul ignore else */
      if (orderBy.field === 'tag-id') {
        tagField = aql`tag._key`
        hasNextPageDocument = aql`LAST(retrievedGuidanceTags)._key`
        hasPreviousPageDocument = aql`FIRST(retrievedGuidanceTags)._key`
      } else if (orderBy.field === 'tag-name') {
        tagField = aql`TRANSLATE(${language}, tag).tagName`
        hasNextPageDocument = aql`LAST(retrievedGuidanceTags).tagName`
        hasPreviousPageDocument = aql`FIRST(retrievedGuidanceTags).tagName`
      } else if (orderBy.field === 'guidance') {
        tagField = aql`TRANSLATE(${language}, tag).guidance`
        hasNextPageDocument = aql`LAST(retrievedGuidanceTags).guidance`
        hasPreviousPageDocument = aql`FIRST(retrievedGuidanceTags).guidance`
      } else if (orderBy.field === 'tag-count') {
        tagField = aql`TRANSLATE(tag._key, tagSummaries)`
        hasNextPageDocument = aql`LAST(retrievedGuidanceTags).count`
        hasPreviousPageDocument = aql`FIRST(retrievedGuidanceTags).count`
      }

      hasNextPageFilter = aql`
      FILTER ${tagField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${tagField} == ${hasNextPageDocument}
      AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedGuidanceTags)._key, "[a-z]+")[1]))
    `

      hasPreviousPageFilter = aql`
      FILTER ${tagField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${tagField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedGuidanceTags)._key, "[a-z]+")[1]))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'tag-id') {
        sortByField = aql`tag._key ${orderBy.direction},`
      } else if (orderBy.field === 'tag-name') {
        sortByField = aql`TRANSLATE(${language}, tag).tagName ${orderBy.direction},`
      } else if (orderBy.field === 'guidance') {
        sortByField = aql`TRANSLATE(${language}, tag).guidance ${orderBy.direction},`
      } else if (orderBy.field === 'tag-count') {
        sortByField = aql`TRANSLATE(tag._key, tagSummaries) ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let guidanceTagInfoCursor
    try {
      guidanceTagInfoCursor = await query`
      WITH guidanceTags
      ${afterVar}
      ${beforeVar}
      
      LET tagSummaries = (${guidanceTags})
      LET retrievedGuidanceTags = (
        FOR tag IN guidanceTags
          FILTER tag._key IN ${tagIds}
          ${afterTemplate}
          ${beforeTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
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
      LET hasNextPage = (LENGTH(
        FOR tag IN guidanceTags
          FILTER tag._key IN ${tagIds}
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)
      LET hasPreviousPage = (LENGTH(
        FOR tag IN guidanceTags
          FILTER tag._key IN ${tagIds}
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)
      RETURN {
        "guidanceTags": retrievedGuidanceTags,
        "totalCount": LENGTH(${tagIds}),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedGuidanceTags)._key,
        "endKey": LAST(retrievedGuidanceTags)._key
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
        edges: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
      }
    }

    const edges = guidanceTagInfo.guidanceTags.map((tag) => ({
      cursor: toGlobalId('guidanceTag', tag._key),
      node: tag,
    }))

    return {
      edges,
      totalCount: guidanceTagInfo.totalCount,
      pageInfo: {
        hasNextPage: guidanceTagInfo.hasNextPage,
        hasPreviousPage: guidanceTagInfo.hasPreviousPage,
        startCursor: toGlobalId('guidanceTag', guidanceTagInfo.startKey),
        endCursor: toGlobalId('guidanceTag', guidanceTagInfo.endKey),
      },
    }
  }
