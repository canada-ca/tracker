const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const dkimResultsLoaderConnectionByDkimId = (
  query,
  userId,
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
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT dkimResult._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT dkimResult._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} had first and last arguments set when trying to gather dkim results for dkimScan: ${dkimId}`,
    )
    throw new Error(
      i18n._(
        t`Unable to have both first, and last arguments set at the same time.`,
      ),
    )
  }

  let dkimResultsCursor
  try {
    dkimResultsCursor = await query`
    LET dkimResultIds = (FOR v, e IN 1 ANY ${dkimId} dkimToDkimResults RETURN e._to)
    FOR dkimResult IN dkimResults
      FILTER dkimResult._id IN dkimResultIds
      ${afterTemplate}
      ${beforeTemplate}
      ${limitTemplate}
      RETURN dkimResult
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get dkim result information for ${dkimId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dkim results. Please try again.`))
  }

  let dkimResults
  try {
    dkimResults = await dkimResultsCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get dkim result information for ${dkimId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dkim results. Please try again.`))
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && dkimResults.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && dkimResults.length > last
  )

  if (dkimResults.length > first || dkimResults.length > last) {
    dkimResults.pop()
  }

  const edges = dkimResults.map((dkimResult) => {
    dkimResult.id = dkimResult._key
    dkimResult.dkimId = dkimId
    return {
      cursor: toGlobalId('dkimResult', dkimResult._key),
      node: dkimResult,
    }
  })

  if (edges.length === 0) {
    return {
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '',
        endCursor: '',
      },
    }
  }

  const startCursor = toGlobalId('dkimResult', dkimResults[0]._key)
  const endCursor = toGlobalId(
    'dkimResult',
    dkimResults[dkimResults.length - 1]._key,
  )

  return {
    edges,
    pageInfo: {
      hasNextPage,
      hasPreviousPage,
      startCursor,
      endCursor,
    },
  }
}

module.exports = {
  dkimResultsLoaderConnectionByDkimId,
}
