const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')

const httpsLoaderConnectionsByDomainId = (
  query,
  userId,
  cleanseInput,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``
  let startDateTemplate = aql``
  let endDateTemplate = aql``
  let limitTemplate = aql``

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(httpsScan._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(httpsScan._key) < TO_NUMBER(${beforeId})`
  }

  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER httpsScan.timestamp >= ${startDate}`
  }

  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER httpsScan.timestamp <= ${endDate}`
  }

  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT httpsScan._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT httpsScan._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} had first and last arguments set when trying to gather https scans for domain: ${domainId}`,
    )
    throw new Error(
      'Unable to have both first, and last arguments set at the same time.',
    )
  }

  let httpsScanCursor
  try {
    httpsScanCursor = await query`
    LET httpsIds = (FOR v, e IN 1 ANY ${domainId} domainsHTTPS RETURN e._to)
    FOR httpsScan IN https
      FILTER httpsScan._id IN httpsIds
      ${afterTemplate}
      ${beforeTemplate}
      ${startDateTemplate}
      ${endDateTemplate}
      ${limitTemplate}
      RETURN httpsScan
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get https information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load https scans. Please try again.')
  }

  let httpsScans
  try {
    httpsScans = await httpsScanCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get https information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load https scans. Please try again.')
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && httpsScans.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && httpsScans.length > last
  )

  if (httpsScans.length > first || httpsScans.length > last) {
    httpsScans.pop()
  }

  const edges = httpsScans.map((httpsScan) => {
    httpsScan.id = httpsScan._key
    httpsScan.domainId = domainId
    return {
      cursor: toGlobalId('https', httpsScan._key),
      node: httpsScan,
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

  const startCursor = toGlobalId('https', httpsScans[0]._key)
  const endCursor = toGlobalId('https', httpsScans[httpsScans.length - 1]._key)

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
  httpsLoaderConnectionsByDomainId,
}
