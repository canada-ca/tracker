const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const spfLoaderConnectionsByDomainId = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
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
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: spfLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`spf\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: spfLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`spf\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: spfLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`spf\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: spfLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`spf\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT spfScan._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT spfScan._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: spfLoaderConnectionsByDomainId.`,
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

  let spfScanInfoCursor
  try {
    spfScanInfoCursor = await query`
    LET spfKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsSPF RETURN v._key)

    LET retrievedSpfScans = (
      FOR spfScan IN spf
        FILTER spfScan._key IN spfKeys
        ${afterTemplate}
        ${beforeTemplate}
        ${startDateTemplate}
        ${endDateTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: spfScan._key }, spfScan)
    )

    LET hasNextPage = (LENGTH(
      FOR spfScan IN spf
        FILTER spfScan._key IN spfKeys
        FILTER TO_NUMBER(spfScan._key) > TO_NUMBER(LAST(retrievedSpfScans)._key)
        SORT spfScan._key ${sortString} LIMIT 1
        RETURN spfScan
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR spfScan IN spf
        FILTER spfScan._key IN spfKeys
        FILTER TO_NUMBER(spfScan._key) < TO_NUMBER(FIRST(retrievedSpfScans)._key)
        SORT spfScan._key ${sortString} LIMIT 1
        RETURN spfScan
    ) > 0 ? true : false)

    RETURN { 
      "spfScans": retrievedSpfScans,
      "totalCount": LENGTH(spfKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedSpfScans)._key, 
      "endKey": LAST(retrievedSpfScans)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to get spf information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load spf scans. Please try again.`))
  }

  let spfScanInfo
  try {
    spfScanInfo = await spfScanInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to get spf information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load spf scans. Please try again.`))
  }

  if (spfScanInfo.spfScans.length === 0) {
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

  const edges = spfScanInfo.spfScans.map((spfScan) => {
    spfScan.domainId = domainId
    return {
      cursor: toGlobalId('spf', spfScan._key),
      node: spfScan,
    }
  })

  return {
    edges,
    totalCount: spfScanInfo.totalCount,
    pageInfo: {
      hasNextPage: spfScanInfo.hasNextPage,
      hasPreviousPage: spfScanInfo.hasPreviousPage,
      startCursor: toGlobalId('spf', spfScanInfo.startKey),
      endCursor: toGlobalId('spf', spfScanInfo.endKey),
    },
  }
}

module.exports = {
  spfLoaderConnectionsByDomainId,
}
