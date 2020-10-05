const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')

const dkimLoaderConnectionsByDomainId = (
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
    afterTemplate = aql`FILTER TO_NUMBER(dkimScan._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(dkimScan._key) < TO_NUMBER(${beforeId})`
  }

  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER dkimScan.timestamp >= ${startDate}`
  }

  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER dkimScan.timestamp <= ${endDate}`
  }

  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT dkimScan._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT dkimScan._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} had first and last arguments set when trying to gather dkim scans for domain: ${domainId}`,
    )
    throw new Error(
      'Unable to have both first, and last arguments set at the same time.',
    )
  }

  let dkimScansCursor
  try {
    dkimScansCursor = await query`
    LET dkimIds = (FOR v, e IN 1 ANY ${domainId} domainsDKIM RETURN e._to)
    FOR dkimScan IN dkim
      FILTER dkimScan._id IN dkimIds
      ${afterTemplate}
      ${beforeTemplate}
      ${startDateTemplate}
      ${endDateTemplate}
      ${limitTemplate}
      RETURN dkimScan
    
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get dkim information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load dkim scans. Please try again.')
  }

  let dkimScans
  try {
    dkimScans = await dkimScansCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get dkim information for ${domainId}, error: ${err}`,
    )
    throw new Error('Unable to load dkim scans. Please try again.')
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && dkimScans.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && dkimScans.length > last
  )

  if (dkimScans.length > first || dkimScans.length > last) {
    dkimScans.pop()
  }

  const edges = dkimScans.map((dkimScan) => {
    dkimScan.id = dkimScan._key
    dkimScan.domainId = domainId
    return {
      cursor: toGlobalId('dkim', dkimScan._key),
      node: dkimScan,
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

  const startCursor = toGlobalId('dkim', dkimScans[0]._key)
  const endCursor = toGlobalId('dkim', dkimScans[dkimScans.length - 1]._key)

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
  dkimLoaderConnectionsByDomainId,
}
