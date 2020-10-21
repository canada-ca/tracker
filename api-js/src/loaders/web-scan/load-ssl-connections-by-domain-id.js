const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const sslLoaderConnectionsByDomainId = (
  query,
  userId,
  cleanseInput,
  i18n,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
  let afterTemplate = aql``
  let beforeTemplate = aql``
  let startDateTemplate = aql``
  let endDateTemplate = aql``
  let limitTemplate = aql``

  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(sslScan._key) > TO_NUMBER(${afterId})`
  }

  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(sslScan._key) < TO_NUMBER(${beforeId})`
  }

  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER sslScan.timestamp >= ${startDate}`
  }

  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER sslScan.timestamp <= ${endDate}`
  }

  if (typeof first !== 'undefined' && typeof last === 'undefined') {
    limitTemplate = aql`SORT sslScan._key ASC LIMIT TO_NUMBER(${first + 1})`
  } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
    limitTemplate = aql`SORT sslScan._key DESC LIMIT TO_NUMBER(${last + 1})`
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} had first and last arguments set when trying to gather ssl scans for domain: ${domainId}`,
    )
    throw new Error(
      i18n._(
        t`Unable to have both first, and last arguments set at the same time.`,
      ),
    )
  }

  let sslScanCursor
  try {
    sslScanCursor = await query`
    LET sslIds = (FOR v, e IN 1 ANY ${domainId} domainsSSL RETURN e._to)
    FOR sslScan IN ssl
      FILTER sslScan._id IN sslIds
      ${afterTemplate}
      ${beforeTemplate}
      ${startDateTemplate}
      ${endDateTemplate}
      ${limitTemplate}
      RETURN sslScan
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get ssl information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load ssl scans. Please try again.`))
  }

  let sslScans
  try {
    sslScans = await sslScanCursor.all()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get ssl information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load ssl scans. Please try again.`))
  }

  const hasNextPage = !!(
    typeof first !== 'undefined' && sslScans.length > first
  )
  const hasPreviousPage = !!(
    typeof last !== 'undefined' && sslScans.length > last
  )

  if (sslScans.length > first || sslScans.length > last) {
    sslScans.pop()
  }

  const edges = await sslScans.map((sslScan) => {
    sslScan.id = sslScan._key
    sslScan.domainId = domainId
    return {
      cursor: toGlobalId('ssl', sslScan._key),
      node: sslScan,
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

  const startCursor = toGlobalId('ssl', sslScans[0]._key)
  const endCursor = toGlobalId('ssl', sslScans[sslScans.length - 1]._key)

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
  sslLoaderConnectionsByDomainId,
}
