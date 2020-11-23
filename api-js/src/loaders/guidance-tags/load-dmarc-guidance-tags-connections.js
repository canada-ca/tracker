const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const dmarcGuidanceTagConnectionsLoader = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ dmarcGuidanceTags, after, before, first, last }) => {
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
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: dmarcGuidanceTagConnectionsLoader.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`guidanceTag\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: dmarcGuidanceTagConnectionsLoader.`,
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
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: dmarcGuidanceTagConnectionsLoader.`,
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
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: dmarcGuidanceTagConnectionsLoader.`,
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
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: dmarcGuidanceTagConnectionsLoader.`,
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

  let dmarcGuidanceTagInfoCursor
  try {
    dmarcGuidanceTagInfoCursor = await query`
      LET retrievedDmarcGuidanceTags = (
        FOR tag IN dmarcGuidanceTags
          FILTER tag._key IN ${dmarcGuidanceTags}
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE(tag, { tagId: tag._key, id: tag._key })
      )

      LET hasNextPage = (LENGTH(
        FOR tag IN dmarcGuidanceTags
          FILTER tag._key IN ${dmarcGuidanceTags}
          FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) > TO_NUMBER(REGEX_SPLIT(LAST(retrievedDmarcGuidanceTags)._key, "[a-z]+")[1])
          SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR tag IN dmarcGuidanceTags
          FILTER tag._key IN ${dmarcGuidanceTags}
          FILTER TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) < TO_NUMBER(REGEX_SPLIT(FIRST(retrievedDmarcGuidanceTags)._key, "[a-z]+")[1])
          SORT TO_NUMBER(REGEX_SPLIT(tag._key, "[a-z]+")[1]) ${sortString} LIMIT 1
          RETURN tag
      ) > 0 ? true : false)
      
      RETURN {
        "dmarcGuidanceTags": retrievedDmarcGuidanceTags,
        "totalCount": LENGTH(${dmarcGuidanceTags}),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedDmarcGuidanceTags)._key,
        "endKey": LAST(retrievedDmarcGuidanceTags)._key
      }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to gather orgs in dmarcGuidanceTagConnectionsLoader, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load dmarc guidance tags. Please try again.`),
    )
  }

  let dmarcGuidanceTagInfo
  try {
    dmarcGuidanceTagInfo = await dmarcGuidanceTagInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to gather orgs in dmarcGuidanceTagConnectionsLoader, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load dmarc guidance tags. Please try again.`),
    )
  }

  if (dmarcGuidanceTagInfo.dmarcGuidanceTags.length === 0) {
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

  const edges = dmarcGuidanceTagInfo.dmarcGuidanceTags.map((tag) => ({
    cursor: toGlobalId('guidanceTags', tag._key),
    node: tag,
  }))

  return {
    edges,
    totalCount: dmarcGuidanceTagInfo.totalCount,
    pageInfo: {
      hasNextPage: dmarcGuidanceTagInfo.hasNextPage,
      hasPreviousPage: dmarcGuidanceTagInfo.hasPreviousPage,
      startCursor: toGlobalId('guidanceTags', dmarcGuidanceTagInfo.startKey),
      endCursor: toGlobalId('guidanceTags', dmarcGuidanceTagInfo.endKey),
    },
  }
}

module.exports = {
  dmarcGuidanceTagConnectionsLoader,
}
