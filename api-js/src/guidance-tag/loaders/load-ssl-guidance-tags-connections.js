import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadSslGuidanceTagConnectionsByTagId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ sslGuidanceTags, after, before, first, last, orderBy }) => {
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

        afterVar = aql`LET afterVar = DOCUMENT(sslGuidanceTags, ${afterId})`

        let tagField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'tag-id') {
          tagField = aql`tag._key`
          documentField = aql`afterVar._key`
        } else if (orderBy.field === 'tag-name') {
          tagField = aql`tag.tagName`
          documentField = aql`afterVar.tagName`
        } else if (orderBy.field === 'guidance') {
          tagField = aql`tag.guidance`
          documentField = aql`afterVar.guidance`
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

        beforeVar = aql`LET beforeVar = DOCUMENT(sslGuidanceTags, ${beforeId})`

        let tagField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'tag-id') {
          tagField = aql`tag._key`
          documentField = aql`beforeVar._key`
        } else if (orderBy.field === 'tag-name') {
          tagField = aql`tag.tagName`
          documentField = aql`beforeVar.tagName`
        } else if (orderBy.field === 'guidance') {
          tagField = aql`tag.guidance`
          documentField = aql`beforeVar.guidance`
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadSslGuidanceTagConnectionsByTagId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`GuidanceTag\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadSslGuidanceTagConnectionsByTagId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`GuidanceTag\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadSslGuidanceTagConnectionsByTagId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`GuidanceTag\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadSslGuidanceTagConnectionsByTagId.`,
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
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadSslGuidanceTagConnectionsByTagId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedSslGuidanceTags)._key, "[a-z]+")[1])`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedSslGuidanceTags)._key, "[a-z]+")[1])`
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
        hasNextPageDocument = aql`LAST(retrievedSslGuidanceTags)._key`
        hasPreviousPageDocument = aql`FIRST(retrievedSslGuidanceTags)._key`
      } else if (orderBy.field === 'tag-name') {
        tagField = aql`tag.tagName`
        hasNextPageDocument = aql`LAST(retrievedSslGuidanceTags).tagName`
        hasPreviousPageDocument = aql`FIRST(retrievedSslGuidanceTags).tagName`
      } else if (orderBy.field === 'guidance') {
        tagField = aql`tag.guidance`
        hasNextPageDocument = aql`LAST(retrievedSslGuidanceTags).guidance`
        hasPreviousPageDocument = aql`FIRST(retrievedSslGuidanceTags).guidance`
      }

      hasNextPageFilter = aql`
      FILTER ${tagField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${tagField} == ${hasNextPageDocument}
      AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedSslGuidanceTags)._key, "[a-z]+")[1]))
    `

      hasPreviousPageFilter = aql`
      FILTER ${tagField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${tagField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedSslGuidanceTags)._key, "[a-z]+")[1]))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'tag-id') {
        sortByField = aql`tag._key ${orderBy.direction},`
      } else if (orderBy.field === 'tag-name') {
        sortByField = aql`tag.tagName ${orderBy.direction},`
      } else if (orderBy.field === 'guidance') {
        sortByField = aql`tag.guidance ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let sslGuidanceTagInfoCursor
    try {
      sslGuidanceTagInfoCursor = await query`
      WITH sslGuidanceTags

      ${afterVar}
      ${beforeVar}

      LET retrievedSslGuidanceTags = (
        FOR tag IN sslGuidanceTags
          FILTER tag._key IN ${sslGuidanceTags}
          ${afterTemplate}
          ${beforeTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
      )

      LET hasNextPage = (LENGTH(
        FOR tag IN sslGuidanceTags
          FILTER tag._key IN ${sslGuidanceTags}
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR tag IN sslGuidanceTags
          FILTER tag._key IN ${sslGuidanceTags}
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)
      
      RETURN {
        "sslGuidanceTags": retrievedSslGuidanceTags,
        "totalCount": LENGTH(${sslGuidanceTags}),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedSslGuidanceTags)._key,
        "endKey": LAST(retrievedSslGuidanceTags)._key
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather orgs in loadSslGuidanceTagConnectionsByTagId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load SSL guidance tag(s). Please try again.`),
      )
    }

    let sslGuidanceTagInfo
    try {
      sslGuidanceTagInfo = await sslGuidanceTagInfoCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather orgs in loadSslGuidanceTagConnectionsByTagId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load SSL guidance tag(s). Please try again.`),
      )
    }

    if (sslGuidanceTagInfo.sslGuidanceTags.length === 0) {
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

    const edges = sslGuidanceTagInfo.sslGuidanceTags.map((tag) => ({
      cursor: toGlobalId('guidanceTag', tag._key),
      node: tag,
    }))

    return {
      edges,
      totalCount: sslGuidanceTagInfo.totalCount,
      pageInfo: {
        hasNextPage: sslGuidanceTagInfo.hasNextPage,
        hasPreviousPage: sslGuidanceTagInfo.hasPreviousPage,
        startCursor: toGlobalId('guidanceTag', sslGuidanceTagInfo.startKey),
        endCursor: toGlobalId('guidanceTag', sslGuidanceTagInfo.endKey),
      },
    }
  }
