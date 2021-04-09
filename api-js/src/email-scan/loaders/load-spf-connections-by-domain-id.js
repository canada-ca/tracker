import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadSpfConnectionsByDomainId = ({
  query,
  userKey,
  cleanseInput,
  i18n,
}) => async ({
  domainId,
  startDate,
  endDate,
  after,
  before,
  first,
  last,
  orderBy,
}) => {
  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    if (typeof orderBy === 'undefined') {
      afterTemplate = aql`FILTER TO_NUMBER(spfScan._key) > TO_NUMBER(${afterId})`
    } else {
      let afterTemplateDirection
      if (orderBy.direction === 'ASC') {
        afterTemplateDirection = aql`>`
      } else {
        afterTemplateDirection = aql`<`
      }

      let spfField, documentField
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        spfField = aql`spfScan.timestamp`
        documentField = aql`DOCUMENT(spf, ${afterId}).timestamp`
      } else if (orderBy.field === 'lookups') {
        spfField = aql`spfScan.lookups`
        documentField = aql`DOCUMENT(spf, ${afterId}).lookups`
      } else if (orderBy.field === 'record') {
        spfField = aql`spfScan.record`
        documentField = aql`DOCUMENT(spf, ${afterId}).record`
      } else if (orderBy.field === 'spf-default') {
        spfField = aql`spfScan.spfDefault`
        documentField = aql`DOCUMENT(spf, ${afterId}).spfDefault`
      }

      afterTemplate = aql`
        FILTER ${spfField} ${afterTemplateDirection} ${documentField}
        OR (${spfField} == ${documentField}
        AND TO_NUMBER(spfScan._key) > TO_NUMBER(${afterId}))
      `
    }
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    if (typeof orderBy === 'undefined') {
      beforeTemplate = aql`FILTER TO_NUMBER(spfScan._key) < TO_NUMBER(${beforeId})`
    } else {
      let beforeTemplateDirection
      if (orderBy.direction === 'ASC') {
        beforeTemplateDirection = aql`<`
      } else {
        beforeTemplateDirection = aql`>`
      }

      let spfField, documentField
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        spfField = aql`spfScan.timestamp`
        documentField = aql`DOCUMENT(spf, ${beforeId}).timestamp`
      } else if (orderBy.field === 'lookups') {
        spfField = aql`spfScan.lookups`
        documentField = aql`DOCUMENT(spf, ${beforeId}).lookups`
      } else if (orderBy.field === 'record') {
        spfField = aql`spfScan.record`
        documentField = aql`DOCUMENT(spf, ${beforeId}).record`
      } else if (orderBy.field === 'spf-default') {
        spfField = aql`spfScan.spfDefault`
        documentField = aql`DOCUMENT(spf, ${beforeId}).spfDefault`
      }

      beforeTemplate = aql`
        FILTER ${spfField} ${beforeTemplateDirection} ${documentField}
        OR (${spfField} == ${documentField}
        AND TO_NUMBER(spfScan._key) < TO_NUMBER(${beforeId}))
      `
    }
  }

  let startDateTemplate = aql``
  if (typeof startDate !== 'undefined') {
    startDateTemplate = aql`
      FILTER DATE_FORMAT(
        DATE_TIMESTAMP(spfScan.timestamp),
        "%y-%m-%d"
      ) >= 
      DATE_FORMAT(
        DATE_TIMESTAMP(${startDate}),
        "%y-%m-%d"
      )
    `
  }

  let endDateTemplate = aql``
  if (typeof endDate !== 'undefined') {
    endDateTemplate = aql`
      FILTER DATE_FORMAT(
        DATE_TIMESTAMP(spfScan.timestamp),
        "%y-%m-%d"
      ) <= 
      DATE_FORMAT(
        DATE_TIMESTAMP(${endDate}),
        "%y-%m-%d"
      )
    `
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadSpfConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`SPF\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadSpfConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`SPF\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadSpfConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`SPF\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadSpfConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting ${amount} records on the \`SPF\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`spfScan._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`spfScan._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadSpfConnectionsByDomainId.`,
    )
    throw new Error(
      i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
    )
  }

  let hasNextPageFilter = aql`FILTER TO_NUMBER(spfScan._key) > TO_NUMBER(LAST(retrievedSpfScans)._key)`
  let hasPreviousPageFilter = aql`FILTER TO_NUMBER(spfScan._key) < TO_NUMBER(FIRST(retrievedSpfScans)._key)`
  if (typeof orderBy !== 'undefined') {
    let hasNextPageDirection
    let hasPreviousPageDirection
    if (orderBy.direction === 'ASC') {
      hasNextPageDirection = aql`>`
      hasPreviousPageDirection = aql`<`
    } else {
      hasNextPageDirection = aql`<`
      hasPreviousPageDirection = aql`>`
    }

    let spfField, hasNextPageDocument, hasPreviousPageDocument
    /* istanbul ignore else */
    if (orderBy.field === 'timestamp') {
      spfField = aql`spfScan.timestamp`
      hasNextPageDocument = aql`DOCUMENT(spf, LAST(retrievedSpfScans)._key).timestamp`
      hasPreviousPageDocument = aql`DOCUMENT(spf, FIRST(retrievedSpfScans)._key).timestamp`
    } else if (orderBy.field === 'lookups') {
      spfField = aql`spfScan.lookups`
      hasNextPageDocument = aql`DOCUMENT(spf, LAST(retrievedSpfScans)._key).lookups`
      hasPreviousPageDocument = aql`DOCUMENT(spf, FIRST(retrievedSpfScans)._key).lookups`
    } else if (orderBy.field === 'record') {
      spfField = aql`spfScan.record`
      hasNextPageDocument = aql`DOCUMENT(spf, LAST(retrievedSpfScans)._key).record`
      hasPreviousPageDocument = aql`DOCUMENT(spf, FIRST(retrievedSpfScans)._key).record`
    } else if (orderBy.field === 'spf-default') {
      spfField = aql`spfScan.spfDefault`
      hasNextPageDocument = aql`DOCUMENT(spf, LAST(retrievedSpfScans)._key).spfDefault`
      hasPreviousPageDocument = aql`DOCUMENT(spf, FIRST(retrievedSpfScans)._key).spfDefault`
    }

    hasNextPageFilter = aql`
      FILTER ${spfField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${spfField} == ${hasNextPageDocument}
      AND TO_NUMBER(spfScan._key) > TO_NUMBER(LAST(retrievedSpfScans)._key))
    `

    hasPreviousPageFilter = aql`
      FILTER ${spfField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${spfField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(spfScan._key) < TO_NUMBER(FIRST(retrievedSpfScans)._key))
    `
  }

  let sortByField = aql``
  if (typeof orderBy !== 'undefined') {
    /* istanbul ignore else */
    if (orderBy.field === 'timestamp') {
      sortByField = aql`spfScan.timestamp ${orderBy.direction},`
    } else if (orderBy.field === 'lookups') {
      sortByField = aql`spfScan.lookups ${orderBy.direction},`
    } else if (orderBy.field === 'record') {
      sortByField = aql`spfScan.record ${orderBy.direction},`
    } else if (orderBy.field === 'spf-default') {
      sortByField = aql`spfScan.spfDefault ${orderBy.direction},`
    }
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
      WITH domains, domainsSPF, spf
      LET spfKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsSPF RETURN v._key)

      LET retrievedSpfScans = (
        FOR spfScan IN spf
          FILTER spfScan._key IN spfKeys
          ${afterTemplate}
          ${beforeTemplate}
          ${startDateTemplate}
          ${endDateTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: spfScan._key, _type: "spf" }, spfScan)
      )

      LET hasNextPage = (LENGTH(
        FOR spfScan IN spf
          FILTER spfScan._key IN spfKeys
          ${hasNextPageFilter}
          SORT ${sortByField} spfScan._key ${sortString} LIMIT 1
          RETURN spfScan
      ) > 0 ? true : false)
      
      LET hasPreviousPage = (LENGTH(
        FOR spfScan IN spf
          FILTER spfScan._key IN spfKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} spfScan._key ${sortString} LIMIT 1
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
    throw new Error(i18n._(t`Unable to load SPF scan(s). Please try again.`))
  }

  let spfScanInfo
  try {
    spfScanInfo = await spfScanInfoCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to get spf information for ${domainId}, error: ${err}`,
    )
    throw new Error(i18n._(t`Unable to load SPF scan(s). Please try again.`))
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
