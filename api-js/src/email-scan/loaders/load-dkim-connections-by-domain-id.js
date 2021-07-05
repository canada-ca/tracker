import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDkimConnectionsByDomainId =
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
        afterTemplate = aql`FILTER TO_NUMBER(dkimScan._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        afterVar = aql`LET afterVar = DOCUMENT(dkim, ${afterId})`

        let dkimField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          documentField = aql`afterVar.timestamp`
          dkimField = aql`dkimScan.timestamp`
        }

        afterTemplate = aql`
        FILTER ${dkimField} ${afterTemplateDirection} ${documentField}
        OR (${dkimField} == ${documentField}
        AND TO_NUMBER(dkimScan._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(dkimScan._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        beforeVar = aql`LET beforeVar = DOCUMENT(dkim, ${beforeId})`

        let dkimField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          documentField = aql`beforeVar.timestamp`
          dkimField = aql`dkimScan.timestamp`
        }

        beforeTemplate = aql`
        FILTER ${dkimField} ${beforeTemplateDirection} ${documentField}
        OR (${dkimField} == ${documentField} 
        AND TO_NUMBER(dkimScan._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let startDateTemplate = aql``
    if (typeof startDate !== 'undefined') {
      startDateTemplate = aql`
      FILTER DATE_FORMAT(
        DATE_TIMESTAMP(dkimScan.timestamp),
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
        DATE_TIMESTAMP(dkimScan.timestamp),
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`DKIM\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`DKIM\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDkimConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`DKIM\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDkimConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting ${amount} records on the \`DKIM\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(dkimScan._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(dkimScan._key) DESC LIMIT TO_NUMBER(${last})`
      } else {
        console.warn(
          `User: ${userKey} tried to have \`first\` and \`last\` arguments set for: loadDkimConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`Passing both \`first\` and \`last\` to paginate the \`DKIM\` connection is not supported.`,
          ),
        )
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDkimConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(dkimScan._key) > TO_NUMBER(LAST(retrievedDkim)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(dkimScan._key) < TO_NUMBER(FIRST(retrievedDkim)._key)`
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

      let dkimField, hasNextPageDocumentField, hasPreviousPageDocumentField
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        dkimField = aql`dkimScan.timestamp`
        hasNextPageDocumentField = aql`LAST(retrievedDkim).timestamp`
        hasPreviousPageDocumentField = aql`FIRST(retrievedDkim).timestamp`
      }

      hasNextPageFilter = aql`
      FILTER ${dkimField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${dkimField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(dkimScan._key) > TO_NUMBER(LAST(retrievedDkim)._key))
    `

      hasPreviousPageFilter = aql`
      FILTER ${dkimField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${dkimField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(dkimScan._key) < TO_NUMBER(FIRST(retrievedDkim)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        sortByField = aql`dkimScan.timestamp ${orderBy.direction},`
      }
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
      WITH dkim, domains, domainsDKIM
      LET dkimKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsDKIM RETURN v._key)

      ${afterVar}
      ${beforeVar}
      
      LET retrievedDkim = (
        FOR dkimScan IN dkim
          FILTER dkimScan._key IN dkimKeys
          ${afterTemplate}
          ${beforeTemplate}
          ${startDateTemplate}
          ${endDateTemplate}

          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: dkimScan._key, _type: "dkim" }, dkimScan)
      )

      LET hasNextPage = (LENGTH(
        FOR dkimScan IN dkim
          FILTER dkimScan._key IN dkimKeys
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(dkimScan._key) ${sortString} LIMIT 1
          RETURN dkimScan
      ) > 0 ? true : false)
      
      LET hasPreviousPage = (LENGTH(
        FOR dkimScan IN dkim
          FILTER dkimScan._key IN dkimKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(dkimScan._key) ${sortString} LIMIT 1
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
      throw new Error(i18n._(t`Unable to load DKIM scan(s). Please try again.`))
    }

    let dkimScanInfo
    try {
      dkimScanInfo = await requestedDkimInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get dkim information for ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load DKIM scan(s). Please try again.`))
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
