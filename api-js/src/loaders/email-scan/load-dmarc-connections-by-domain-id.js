const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')

const dmarcLoaderConnectionsByDomainId = (
  query,
  userId,
  cleanseInput,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(dmarcScan._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(dmarcScan._key) < TO_NUMBER(${beforeId})`
  }

  let startDateTemplate = aql``
  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER dmarcScan.timestamp >= ${startDate}`
  }

  let endDateTemplate = aql``
  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER dmarcScan.timestamp <= ${endDate}`
  }

  let limitTemplate = aql``
  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT dmarcScan._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT dmarcScan._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} had first and last arguments set when trying to gather dmarc scans for domain: ${domainId}`,
    )
    throw new Error(
      'Unable to have both first, and last arguments set at the same time.',
    )
  }

  let dmarcScansCursor
  try {
    dmarcScansCursor = await query`
    LET dmarcIds = (FOR v, e IN 1 ANY ${domainId} domainsDMARC RETURN e._to)
    FOR dmarcScan IN dmarc
        FILTER dmarcScan._id IN dmarcIds
        ${afterTemplate}
        ${beforeTemplate}
        ${startDateTemplate}
        ${endDateTemplate}
        ${limitTemplate}
        RETURN dmarcScan
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get dmarc information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load dmarc scans. Please try again.')
  }

  let dmarcScans
  try {
    dmarcScans = await dmarcScansCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get dmarc information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load dmarc scans. Please try again.')
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && dmarcScans.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && dmarcScans.length > last
  )

  if (dmarcScans.length > first || dmarcScans.length > last) {
    dmarcScans.pop()
  }

  const edges = dmarcScans.map((dmarcScan) => {
    dmarcScan.id = dmarcScan._key
    dmarcScan.domainId = domainId
    return {
      cursor: toGlobalId('dmarc', dmarcScan._key),
      node: dmarcScan,
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

  const startCursor = toGlobalId('dmarc', dmarcScans[0]._key)
  const endCursor = toGlobalId('dmarc', dmarcScans[dmarcScans.length - 1]._key)

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
  dmarcLoaderConnectionsByDomainId,
}
