import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDmarcConnectionsByDomainId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({
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
    let afterVar = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(dmarcScan._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        afterVar = aql`LET afterVar = DOCUMENT(dmarc, ${afterId})`

        let dmarcField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          dmarcField = aql`dmarcScan.timestamp`
          documentField = aql`afterVar.timestamp`
        } else if (orderBy.field === 'record') {
          dmarcField = aql`dmarcScan.record`
          documentField = aql`afterVar.record`
        } else if (orderBy.field === 'p-policy') {
          dmarcField = aql`dmarcScan.pPolicy`
          documentField = aql`afterVar.pPolicy`
        } else if (orderBy.field === 'sp-policy') {
          dmarcField = aql`dmarcScan.spPolicy`
          documentField = aql`afterVar.spPolicy`
        } else if (orderBy.field === 'pct') {
          dmarcField = aql`dmarcScan.pct`
          documentField = aql`afterVar.pct`
        }

        afterTemplate = aql`
        FILTER ${dmarcField} ${afterTemplateDirection} ${documentField}
        OR (${dmarcField} == ${documentField}
        AND TO_NUMBER(dmarcScan._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(dmarcScan._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        beforeVar = aql`LET beforeVar = DOCUMENT(dmarc, ${beforeId})`

        let dmarcField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          dmarcField = aql`dmarcScan.timestamp`
          documentField = aql`beforeVar.timestamp`
        } else if (orderBy.field === 'record') {
          dmarcField = aql`dmarcScan.record`
          documentField = aql`beforeVar.record`
        } else if (orderBy.field === 'p-policy') {
          dmarcField = aql`dmarcScan.pPolicy`
          documentField = aql`beforeVar.pPolicy`
        } else if (orderBy.field === 'sp-policy') {
          dmarcField = aql`dmarcScan.spPolicy`
          documentField = aql`beforeVar.spPolicy`
        } else if (orderBy.field === 'pct') {
          dmarcField = aql`dmarcScan.pct`
          documentField = aql`beforeVar.pct`
        }

        beforeTemplate = aql`
        FILTER ${dmarcField} ${beforeTemplateDirection} ${documentField}
        OR (${dmarcField} == ${documentField} 
        AND TO_NUMBER(dmarcScan._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let startDateTemplate = aql``
    if (typeof startDate !== 'undefined') {
      startDateTemplate = aql`
      FILTER DATE_FORMAT(
        DATE_TIMESTAMP(dmarcScan.timestamp),
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
        DATE_TIMESTAMP(dmarcScan.timestamp),
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDmarcConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`DMARC\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDmarcConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`DMARC\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'

        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDmarcConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`DMARC\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDmarcConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting ${amount} records on the \`DMARC\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(dmarcScan._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(dmarcScan._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDmarcConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(dmarcScan._key) > TO_NUMBER(LAST(retrievedDmarcScans)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(dmarcScan._key) < TO_NUMBER(FIRST(retrievedDmarcScans)._key)`
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

      let dmarcField, hasNextPageDocumentField, hasPreviousPageDocumentField
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        dmarcField = aql`dmarcScan.timestamp`
        hasNextPageDocumentField = aql`LAST(retrievedDmarcScans).timestamp`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDmarcScans).timestamp`
      } else if (orderBy.field === 'record') {
        dmarcField = aql`dmarcScan.record`
        hasNextPageDocumentField = aql`LAST(retrievedDmarcScans).record`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDmarcScans).record`
      } else if (orderBy.field === 'p-policy') {
        dmarcField = aql`dmarcScan.pPolicy`
        hasNextPageDocumentField = aql`LAST(retrievedDmarcScans).pPolicy`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDmarcScans).pPolicy`
      } else if (orderBy.field === 'sp-policy') {
        dmarcField = aql`dmarcScan.spPolicy`
        hasNextPageDocumentField = aql`LAST(retrievedDmarcScans).spPolicy`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDmarcScans).spPolicy`
      } else if (orderBy.field === 'pct') {
        dmarcField = aql`dmarcScan.pct`
        hasNextPageDocumentField = aql`LAST(retrievedDmarcScans).pct`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDmarcScans).pct`
      }

      hasNextPageFilter = aql`
      FILTER ${dmarcField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${dmarcField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(dmarcScan._key) > TO_NUMBER(LAST(retrievedDmarcScans)._key))
    `

      hasPreviousPageFilter = aql`
      FILTER ${dmarcField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${dmarcField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(dmarcScan._key) < TO_NUMBER(FIRST(retrievedDmarcScans)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        sortByField = aql`dmarcScan.timestamp ${orderBy.direction},`
      } else if (orderBy.field === 'record') {
        sortByField = aql`dmarcScan.record ${orderBy.direction},`
      } else if (orderBy.field === 'p-policy') {
        sortByField = aql`dmarcScan.pPolicy ${orderBy.direction},`
      } else if (orderBy.field === 'sp-policy') {
        sortByField = aql`dmarcScan.spPolicy ${orderBy.direction},`
      } else if (orderBy.field === 'pct') {
        sortByField = aql`dmarcScan.pct ${orderBy.direction},`
      }
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
      WITH dmarc, domains, domainsDMARC
      LET dmarcKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsDMARC RETURN v._key)

      ${afterVar}
      ${beforeVar}

      LET retrievedDmarcScans = (
        FOR dmarcScan IN dmarc
          FILTER dmarcScan._key IN dmarcKeys
          ${afterTemplate}
          ${beforeTemplate}
          ${startDateTemplate}
          ${endDateTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: dmarcScan._key, _type: "dmarc" }, dmarcScan)
      )

      LET hasNextPage = (LENGTH(
        FOR dmarcScan IN dmarc
          FILTER dmarcScan._key IN dmarcKeys
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(dmarcScan._key) ${sortString} LIMIT 1
          RETURN dmarcScan
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR dmarcScan IN dmarc
          FILTER dmarcScan._key IN dmarcKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(dmarcScan._key) ${sortString} LIMIT 1
          RETURN dmarcScan
      ) > 0 ? true : false)

      RETURN { 
        "dmarcScans": retrievedDmarcScans,
        "totalCount": LENGTH(dmarcKeys),
        "hasNextPage": hasNextPage, 
        "hasPreviousPage": hasPreviousPage, 
        "startKey": FIRST(retrievedDmarcScans)._key, 
        "endKey": LAST(retrievedDmarcScans)._key 
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get dmarc information for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DMARC scan(s). Please try again.`),
      )
    }

    let dmarcScanInfo
    try {
      dmarcScanInfo = await dmarcScanInfoCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get dmarc information for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DMARC scan(s). Please try again.`),
      )
    }

    if (dmarcScanInfo.dmarcScans.length === 0) {
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

    const edges = dmarcScanInfo.dmarcScans.map((dmarcScan) => {
      dmarcScan.domainId = domainId
      return {
        cursor: toGlobalId('dmarc', dmarcScan._key),
        node: dmarcScan,
      }
    })

    return {
      edges,
      totalCount: dmarcScanInfo.totalCount,
      pageInfo: {
        hasNextPage: dmarcScanInfo.hasNextPage,
        hasPreviousPage: dmarcScanInfo.hasPreviousPage,
        startCursor: toGlobalId('dmarc', dmarcScanInfo.startKey),
        endCursor: toGlobalId('dmarc', dmarcScanInfo.endKey),
      },
    }
  }
