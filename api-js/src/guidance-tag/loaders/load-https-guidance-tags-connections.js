import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const httpsGuidanceTagConnectionsLoader = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ httpsGuidanceTags, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(${afterId}, "[a-z]+")[1])`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(${beforeId}, "[a-z]+")[1])`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: httpsGuidanceTagConnectionsLoader.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`guidanceTag\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: httpsGuidanceTagConnectionsLoader.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`guidanceTag\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: httpsGuidanceTagConnectionsLoader.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`guidanceTag\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: httpsGuidanceTagConnectionsLoader.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`guidanceTag\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: httpsGuidanceTagConnectionsLoader.`,
    )
    throw new Error(
      i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
    )
  }

  let sortString
  if (typeof last !== 'undefined') {
    sortString = aql`DESC`
  } else {
    sortString = aql`ASC`
  }

  let httpsGuidanceTagInfoCursor
  try {
    httpsGuidanceTagInfoCursor = await query`
      LET retrievedHttpsGuidanceTags = (
        FOR tag IN httpsGuidanceTags
          FILTER tag._key IN ${httpsGuidanceTags}
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key, _type: "guidanceTag" })
      )

      LET hasNextPage = (LENGTH(
        FOR tag IN httpsGuidanceTags
          FILTER tag._key IN ${httpsGuidanceTags}
          FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedHttpsGuidanceTags)._key, "[a-z]+")[1])
          SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR tag IN httpsGuidanceTags
          FILTER tag._key IN ${httpsGuidanceTags}
          FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedHttpsGuidanceTags)._key, "[a-z]+")[1])
          SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)
      
      RETURN {
        "httpsGuidanceTags": retrievedHttpsGuidanceTags,
        "totalCount": LENGTH(${httpsGuidanceTags}),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedHttpsGuidanceTags)._key,
        "endKey": LAST(retrievedHttpsGuidanceTags)._key
      }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to gather orgs in httpsGuidanceTagConnectionsLoader, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load https guidance tags. Please try again.`),
    )
  }

  let httpsGuidanceTagInfo
  try {
    httpsGuidanceTagInfo = await httpsGuidanceTagInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to gather orgs in httpsGuidanceTagConnectionsLoader, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load https guidance tags. Please try again.`),
    )
  }

  if (httpsGuidanceTagInfo.httpsGuidanceTags.length === 0) {
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

  const edges = httpsGuidanceTagInfo.httpsGuidanceTags.map((tag) => ({
    cursor: toGlobalId('guidanceTags', tag._key),
    node: tag,
  }))

  return {
    edges,
    totalCount: httpsGuidanceTagInfo.totalCount,
    pageInfo: {
      hasNextPage: httpsGuidanceTagInfo.hasNextPage,
      hasPreviousPage: httpsGuidanceTagInfo.hasPreviousPage,
      startCursor: toGlobalId('guidanceTags', httpsGuidanceTagInfo.startKey),
      endCursor: toGlobalId('guidanceTags', httpsGuidanceTagInfo.endKey),
    },
  }
}
