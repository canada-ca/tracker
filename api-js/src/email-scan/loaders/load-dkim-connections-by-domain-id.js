import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const dkimLoaderConnectionsByDomainId = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(dkimScan._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(dkimScan._key) < TO_NUMBER(${beforeId})`
  }

  let startDateTemplate = aql``
  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER dkimScan.timestamp >= ${startDate}`
  }

  let endDateTemplate = aql``
  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER dkimScan.timestamp <= ${endDate}`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: dkimLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`dkim\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: dkimLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`dkim\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: dkimLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`dkim\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: dkimLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`dkim\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT dkimScan._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT dkimScan._key DESC LIMIT TO_NUMBER(${last})`
    } else {
      console.warn(
        `User: ${userKey} tried to have \`first\` and \`last\` arguments set for: dkimLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`dkim\` connection is not supported.`,
        ),
      )
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: dkimLoaderConnectionsByDomainId.`,
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

  let requestedDkimInfo
  try {
    requestedDkimInfo = await query`
    LET dkimKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsDKIM RETURN v._key)
    
    LET retrievedDkim = (
      FOR dkimScan IN dkim
        FILTER dkimScan._key IN dkimKeys
        ${afterTemplate}
        ${beforeTemplate}
        ${startDateTemplate}
        ${endDateTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: dkimScan._key, _type: "dkim" }, dkimScan)
    )

    LET hasNextPage = (LENGTH(
      FOR dkimScan IN dkim
        FILTER dkimScan._key IN dkimKeys
        FILTER TO_NUMBER(dkimScan._key) > TO_NUMBER(LAST(retrievedDkim)._key)
        SORT dkimScan._key ${sortString} LIMIT 1
        RETURN dkimScan
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR dkimScan IN dkim
        FILTER dkimScan._key IN dkimKeys
        FILTER TO_NUMBER(dkimScan._key) < TO_NUMBER(FIRST(retrievedDkim)._key)
        SORT dkimScan._key ${sortString} LIMIT 1
        RETURN dkimScan
    ) > 0 ? true : false)

    RETURN { 
      "dkimScans": retrievedDkim,
      "totalCount": LENGTH(dkimKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedDkim)._key, 
      "endKey": LAST(retrievedDkim)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to get dkim information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dkim scans. Please try again.`))
  }

  let dkimScanInfo
  try {
    dkimScanInfo = await requestedDkimInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to get dkim information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load dkim scans. Please try again.`))
  }

  if (dkimScanInfo.dkimScans.length === 0) {
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

  const edges = dkimScanInfo.dkimScans.map((dkimScan) => {
    dkimScan.domainId = domainId
    return {
      cursor: toGlobalId('dkim', dkimScan._key),
      node: dkimScan,
    }
  })

  return {
    edges,
    totalCount: dkimScanInfo.totalCount,
    pageInfo: {
      hasNextPage: dkimScanInfo.hasNextPage,
      hasPreviousPage: dkimScanInfo.hasPreviousPage,
      startCursor: toGlobalId('dkim', dkimScanInfo.startKey),
      endCursor: toGlobalId('dkim', dkimScanInfo.endKey),
    },
  }
}
