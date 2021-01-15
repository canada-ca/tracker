import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const sslLoaderConnectionsByDomainId = (
  query,
  userKey,
  cleanseInput,
  i18n,
) => async ({ domainId, startDate, endDate, after, before, first, last }) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(sslScan._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(sslScan._key) < TO_NUMBER(${beforeId})`
  }

  let startDateTemplate = aql``
  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`FILTER sslScan.timestamp >= ${startDate}`
  }

  let endDateTemplate = aql``
  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`FILTER sslScan.timestamp <= ${endDate}`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: sslLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`ssl\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} tried to have \`first\` and \`last\` arguments set for: sslLoaderConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`ssl\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: sslLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`ssl\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: sslLoaderConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`ssl\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT sslScan._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT sslScan._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: sslLoaderConnectionsByDomainId.`,
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

  let requestedSslInfo
  try {
    requestedSslInfo = await query`
    LET sslKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsSSL RETURN v._key)

    LET retrievedSsl = (
      FOR sslScan IN ssl
        FILTER sslScan._key IN sslKeys
        ${afterTemplate}
        ${beforeTemplate}
        ${startDateTemplate}
        ${endDateTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: sslScan._key }, sslScan)
    )

    LET hasNextPage = (LENGTH(
      FOR sslScan IN ssl
        FILTER sslScan._key IN sslKeys
        FILTER TO_NUMBER(sslScan._key) > TO_NUMBER(LAST(retrievedSsl)._key)
        SORT sslScan._key ${sortString} LIMIT 1
        RETURN sslScan
    ) > 0 ? true : false)
    
    LET hasPreviousPage = (LENGTH(
      FOR sslScan IN ssl
        FILTER sslScan._key IN sslKeys
        FILTER TO_NUMBER(sslScan._key) < TO_NUMBER(FIRST(retrievedSsl)._key)
        SORT sslScan._key ${sortString} LIMIT 1
        RETURN sslScan
    ) > 0 ? true : false)

    RETURN { 
      "sslScans": retrievedSsl,
      "totalCount": LENGTH(sslKeys),
      "hasNextPage": hasNextPage, 
      "hasPreviousPage": hasPreviousPage, 
      "startKey": FIRST(retrievedSsl)._key, 
      "endKey": LAST(retrievedSsl)._key 
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to get ssl information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load ssl scans. Please try again.`))
  }

  let sslScansInfo
  try {
    sslScansInfo = await requestedSslInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to get ssl information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load ssl scans. Please try again.`))
  }

  if (sslScansInfo.sslScans.length === 0) {
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

  const edges = await sslScansInfo.sslScans.map((sslScan) => {
    sslScan.domainId = domainId
    return {
      cursor: toGlobalId('ssl', sslScan._key),
      node: sslScan,
    }
  })

  return {
    edges,
    totalCount: sslScansInfo.totalCount,
    pageInfo: {
      hasNextPage: sslScansInfo.hasNextPage,
      hasPreviousPage: sslScansInfo.hasPreviousPage,
      startCursor: toGlobalId('ssl', sslScansInfo.startKey),
      endCursor: toGlobalId('ssl', sslScansInfo.endKey),
    },
  }
}
