import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const httpsLoaderConnectionsByDomainId = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(httpsScan._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(httpsScan._key) < TO_NUMBER(${beforeId})`
  }

  let startDateTemplate = aql``
  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER httpsScan.timestamp >= ${startDate}`
  }

  let endDateTemplate = aql``
  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER httpsScan.timestamp <= ${endDate}`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: httpsLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`https\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} tried to have \`first\` and \`last\` arguments set for: httpsLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`https\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: httpsLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`https\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: httpsLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`https\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT httpsScan._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT httpsScan._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: httpsLoaderConnectionsByDomainId.`,
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

  let requestedHttpsInfo
  try {
    requestedHttpsInfo = await query`
    LET httpsKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsHTTPS RETURN v._key)

    LET retrievedHttps = (
      FOR httpsScan IN https
        FILTER httpsScan._key IN httpsKeys
        ${afterTemplate}
        ${beforeTemplate}
        ${startDateTemplate}
        ${endDateTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: httpsScan._key }, httpsScan)
    )

    LET hasNextPage = (LENGTH(
      FOR httpsScan IN https
        FILTER httpsScan._key IN httpsKeys
        FILTER TO_NUMBER(httpsScan._key) > TO_NUMBER(LAST(retrievedHttps)._key)
        SORT httpsScan._key ${sortString} LIMIT 1
        RETURN httpsScan
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR httpsScan IN https
        FILTER httpsScan._key IN httpsKeys
        FILTER TO_NUMBER(httpsScan._key) < TO_NUMBER(FIRST(retrievedHttps)._key)
        SORT httpsScan._key ${sortString} LIMIT 1
        RETURN httpsScan
    ) > 0 ? true : false)

    RETURN { 
      "httpsScans": retrievedHttps,
      "totalCount": LENGTH(httpsKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedHttps)._key, 
      "endKey": LAST(retrievedHttps)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to get https information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load https scans. Please try again.`))
  }

  let httpsScanInfo
  try {
    httpsScanInfo = await requestedHttpsInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to get https information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load https scans. Please try again.`))
  }

  if (httpsScanInfo.httpsScans.length === 0) {
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

  const edges = httpsScanInfo.httpsScans.map((httpsScan) => {
    httpsScan.domainId = domainId
    return {
      cursor: toGlobalId('https', httpsScan._key),
      node: httpsScan,
    }
  })

  return {
    edges,
    totalCount: httpsScanInfo.totalCount,
    pageInfo: {
      hasNextPage: httpsScanInfo.hasNextPage,
      hasPreviousPage: httpsScanInfo.hasPreviousPage,
      startCursor: toGlobalId('https', httpsScanInfo.startKey),
      endCursor: toGlobalId('https', httpsScanInfo.endKey),
    },
  }
}
