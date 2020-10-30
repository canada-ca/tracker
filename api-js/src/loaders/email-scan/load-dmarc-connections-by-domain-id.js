const { aql } = require('arangojs')
const { fromGlobalId, toGlobalId } = require('graphql-relay')
const { t } = require('@lingui/macro')

const dmarcLoaderConnectionsByDomainId = (
  query,
  userId,
  cleanseInput,
  i18n,
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
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userId} did not have either \`first\` or \`last\` arguments set for: dmarcLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`dmarc\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userId} attempted to have \`first\` and \`last\` arguments set for: dmarcLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`dmarc\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'

      console.warn(
        `User: ${userId} attempted to have \`${argSet}\` set below zero for: dmarcLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`dmarc\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userId} attempted to have \`${argSet}\` set to ${amount} for: dmarcLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`dmarc\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT dmarcScan._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT dmarcScan._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userId} attempted to have \`${argSet}\` set as a ${typeSet} for: dmarcLoaderConnectionsByDomainId.`,
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

  let dmarcScanInfoCursor
  try {
    dmarcScanInfoCursor = await query`
    LET dmarcKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsDMARC RETURN v._key)

    LET retrievedDmarcScans = (
      FOR dmarcScan IN dmarc
      FILTER dmarcScan._key IN dmarcKeys
      ${afterTemplate}
      ${beforeTemplate}
      ${startDateTemplate}
      ${endDateTemplate}
      ${limitTemplate}
      RETURN dmarcScan
    )

    LET hasNextPage = (LENGTH(
      FOR dmarcScan IN dmarc
        FILTER dmarcScan._key IN dmarcKeys
        FILTER TO_NUMBER(dmarcScan._key) > TO_NUMBER(LAST(retrievedDmarcScans)._key)
        SORT dmarcScan._key ${sortString} LIMIT 1
        RETURN dmarcScan
    ) > 0 ? true : false)

    LET hasPreviousPage = (LENGTH(
      FOR dmarcScan IN dmarc
        FILTER dmarcScan._key IN dmarcKeys
        FILTER TO_NUMBER(dmarcScan._key) < TO_NUMBER(FIRST(retrievedDmarcScans)._key)
        SORT dmarcScan._key ${sortString} LIMIT 1
        RETURN dmarcScan
    ) > 0 ? true : false)

    RETURN { 
      "dmarcScans": retrievedDmarcScans, 
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedDmarcScans)._key, 
      "endKey": LAST(retrievedDmarcScans)._key 
    }

    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userId} was trying to get dmarc information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dmarc scans. Please try again.`))
  }

  let dmarcScanInfo
  try {
    dmarcScanInfo = await dmarcScanInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userId} was trying to get dmarc information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dmarc scans. Please try again.`))
  }

  if (dmarcScanInfo.dmarcScans.length === 0) {
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

  const edges = dmarcScanInfo.dmarcScans.map((dmarcScan) => {
    dmarcScan.id = dmarcScan._key
    dmarcScan.domainId = domainId
    return {
      cursor: toGlobalId('dmarc', dmarcScan._key),
      node: dmarcScan,
    }
  })

  return {
    edges,
    pageInfo: {
      hasNextPage: dmarcScanInfo.hasNextPage,
      hasPreviousPage: dmarcScanInfo.hasPreviousPage,
      startCursor: toGlobalId('dmarc', dmarcScanInfo.startKey),
      endCursor: toGlobalId('dmarc', dmarcScanInfo.endKey),
    },
  }
}

module.exports = {
  dmarcLoaderConnectionsByDomainId,
}
