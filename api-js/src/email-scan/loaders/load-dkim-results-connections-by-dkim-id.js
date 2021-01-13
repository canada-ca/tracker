import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const dkimResultsLoaderConnectionByDkimId = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ dkimId, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(dkimResult._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(dkimResult._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: dkimResultsLoaderConnectionByDkimId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`dkimResults\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: dkimResultsLoaderConnectionByDkimId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`dkimResults\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: dkimResultsLoaderConnectionByDkimId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`dkimResults\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: dkimResultsLoaderConnectionByDkimId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`dkimResults\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT dkimResult._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT dkimResult._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: dkimResultsLoaderConnectionByDkimId.`,
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

  let dkimResultsCursor
  try {
    dkimResultsCursor = await query`
    LET dkimResultKeys = (FOR v, e IN 1 OUTBOUND ${dkimId} dkimToDkimResults RETURN v._key)

    LET retrievedDkimResults = (
      FOR dkimResult IN dkimResults
        FILTER dkimResult._key IN dkimResultKeys
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: dkimResult._key }, dkimResult)
    )

    LET hasNextPage = (LENGTH(
      FOR dkimResult IN dkimResults
        FILTER dkimResult._key IN dkimResultKeys
        FILTER TO_NUMBER(dkimResult._key) > TO_NUMBER(LAST(retrievedDkimResults)._key)
        SORT dkimResult._key ${sortString} LIMIT 1
        RETURN dkimResult
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR dkimResult IN dkimResults
        FILTER dkimResult._key IN dkimResultKeys
        FILTER TO_NUMBER(dkimResult._key) < TO_NUMBER(FIRST(retrievedDkimResults)._key)
        SORT dkimResult._key ${sortString} LIMIT 1
        RETURN dkimResult
    ) > 0 ? true : false)

    RETURN { 
      "dkimResults": retrievedDkimResults,
      "totalCount": LENGTH(dkimResultKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedDkimResults)._key, 
      "endKey": LAST(retrievedDkimResults)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to get dkim result information for ${dkimId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dkim results. Please try again.`))
  }

  let dkimResultsInfo
  try {
    dkimResultsInfo = await dkimResultsCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to get dkim result information for ${dkimId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dkim results. Please try again.`))
  }

  if (dkimResultsInfo.dkimResults.length === 0) {
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

  const edges = dkimResultsInfo.dkimResults.map((dkimResult) => {
    dkimResult.dkimId = dkimId
    return {
      cursor: toGlobalId('dkimResult', dkimResult._key),
      node: dkimResult,
    }
  })

  return {
    edges,
    totalCount: dkimResultsInfo.totalCount,
    pageInfo: {
      hasNextPage: dkimResultsInfo.hasNextPage,
      hasPreviousPage: dkimResultsInfo.hasPreviousPage,
      startCursor: toGlobalId('dkimResult', dkimResultsInfo.startKey),
      endCursor: toGlobalId('dkimResult', dkimResultsInfo.endKey),
    },
  }
}
