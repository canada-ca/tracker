const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const spfGuidanceTagConnectionsLoader = (
  query,
  userId,
  cleanseInput,
  i18n,
) => async ({ spfGuidanceTags, after, before, first, last }) => {
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
      `User: ${userId} did not have either \`first\` or \`last\` arguments set for: spfGuidanceTagConnectionsLoader.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`guidanceTag\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} attempted to have \`first\` and \`last\` arguments set for: spfGuidanceTagConnectionsLoader.`,
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
        `User: ${userId} attempted to have \`${argSet}\` set below zero for: spfGuidanceTagConnectionsLoader.`,
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
        `User: ${userId} attempted to have \`${argSet}\` set to ${amount} for: spfGuidanceTagConnectionsLoader.`,
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
      `User: ${userId} attempted to have \`${argSet}\` set as a ${typeSet} for: spfGuidanceTagConnectionsLoader.`,
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

  let spfGuidanceTagInfoCursor
  try {
    spfGuidanceTagInfoCursor = await query`
      LET retrievedSpfGuidanceTags = (
        FOR tag IN spfGuidanceTags
          FILTER tag._key IN ${spfGuidanceTags}
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      )

      LET hasNextPage = (LENGTH(
        FOR tag IN spfGuidanceTags
          FILTER tag._key IN ${spfGuidanceTags}
          FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedSpfGuidanceTags)._key, "[a-z]+")[1])
          SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR tag IN spfGuidanceTags
          FILTER tag._key IN ${spfGuidanceTags}
          FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedSpfGuidanceTags)._key, "[a-z]+")[1])
          SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)
      
      RETURN {
        "spfGuidanceTags": retrievedSpfGuidanceTags,
        "totalCount": LENGTH(${spfGuidanceTags}),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedSpfGuidanceTags)._key,
        "endKey": LAST(retrievedSpfGuidanceTags)._key
      }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to gather orgs in spfGuidanceTagConnectionsLoader, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load spf guidance tags. Please try again.`),
    )
  }

  let spfGuidanceTagInfo
  try {
    spfGuidanceTagInfo = await spfGuidanceTagInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to gather orgs in spfGuidanceTagConnectionsLoader, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load spf guidance tags. Please try again.`),
    )
  }

  if (spfGuidanceTagInfo.spfGuidanceTags.length === 0) {
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

  const edges = spfGuidanceTagInfo.spfGuidanceTags.map((tag) => ({
    cursor: toGlobalId('guidanceTags', tag._key),
    node: tag,
  }))

  return {
    edges,
    totalCount: spfGuidanceTagInfo.totalCount,
    pageInfo: {
      hasNextPage: spfGuidanceTagInfo.hasNextPage,
      hasPreviousPage: spfGuidanceTagInfo.hasPreviousPage,
      startCursor: toGlobalId('guidanceTags', spfGuidanceTagInfo.startKey),
      endCursor: toGlobalId('guidanceTags', spfGuidanceTagInfo.endKey),
    },
  }
}

module.exports = {
  spfGuidanceTagConnectionsLoader,
}
