const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')

const spfLoaderConnectionsByDomainId = (query, userId, cleanseInput) => async ({
  domainId,
  startDate,
  endDate,
  after,
  before,
  first,
  last,
}) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(spfScan._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(spfScan._key) < TO_NUMBER(${beforeId})`
  }

  let startDateTemplate = aql``
  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER spfScan.timestamp >= ${startDate}`
  }

  let endDateTemplate = aql``
  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER spfScan.timestamp <= ${endDate}`
  }

  let limitTemplate = aql``
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT spfScan._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT spfScan._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} had first and last arguments set when trying to gather spf scans for domain: ${domainId}`,
    )
    throw new Error(
      'Unable to have both first, and last arguments set at the same time.',
    )
  }

  let spfScanCursor
  try {
    spfScanCursor = await query`
    LET spfIds = (FOR v, e IN 1 ANY ${domainId} domainsSPF RETURN e._to)
    FOR spfScan IN spf
      FILTER spfScan._id IN spfIds
      ${afterTemplate}
      ${beforeTemplate}
      ${startDateTemplate}
      ${endDateTemplate}
      ${limitTemplate}
      RETURN spfScan    
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get spf information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load spf scans. Please try again.')
  }

  let spfScans
  try {
    spfScans = await spfScanCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get spf information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load spf scans. Please try again.')
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && spfScans.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && spfScans.length > last
  )

  if (spfScans.length > first || spfScans.length > last) {
    spfScans.pop()
  }

  const edges = spfScans.map((spfScan) => {
    spfScan.id = spfScan._key
    spfScan.domainId = domainId
    return {
      cursor: toGlobalId('spf', spfScan._key),
      node: spfScan,
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

  const startCursor = toGlobalId('spf', spfScans[0]._key)
  const endCursor = toGlobalId('spf', spfScans[spfScans.length - 1]._key)

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
  spfLoaderConnectionsByDomainId,
}
