import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadHttpsConnectionsByDomainId =
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
        afterTemplate = aql`FILTER TO_NUMBER(httpsScan._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        afterVar = aql`LET afterVar = DOCUMENT(https, ${afterId})`

        let documentField = aql``
        let httpsField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          documentField = aql`afterVar.timestamp`
          httpsField = aql`httpsScan.timestamp`
        } else if (orderBy.field === 'implementation') {
          documentField = aql`afterVar.implementation`
          httpsField = aql`httpsScan.implementation`
        } else if (orderBy.field === 'enforced') {
          documentField = aql`afterVar.enforced`
          httpsField = aql`httpsScan.enforced`
        } else if (orderBy.field === 'hsts') {
          documentField = aql`afterVar.hsts`
          httpsField = aql`httpsScan.hsts`
        } else if (orderBy.field === 'hsts-age') {
          documentField = aql`afterVar.hstsAge`
          httpsField = aql`httpsScan.hstsAge`
        } else if (orderBy.field === 'preloaded') {
          documentField = aql`afterVar.preloaded`
          httpsField = aql`httpsScan.preloaded`
        }

        afterTemplate = aql`
        FILTER ${httpsField} ${afterTemplateDirection} ${documentField}
        OR (${httpsField} == ${documentField}
        AND TO_NUMBER(httpsScan._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``

    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(httpsScan._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        beforeVar = aql`LET beforeVar = DOCUMENT(https, ${beforeId})`

        let documentField = aql``
        let httpsField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'timestamp') {
          documentField = aql`beforeVar.timestamp`
          httpsField = aql`httpsScan.timestamp`
        } else if (orderBy.field === 'implementation') {
          documentField = aql`beforeVar.implementation`
          httpsField = aql`httpsScan.implementation`
        } else if (orderBy.field === 'enforced') {
          documentField = aql`beforeVar.enforced`
          httpsField = aql`httpsScan.enforced`
        } else if (orderBy.field === 'hsts') {
          documentField = aql`beforeVar.hsts`
          httpsField = aql`httpsScan.hsts`
        } else if (orderBy.field === 'hsts-age') {
          documentField = aql`beforeVar.hstsAge`
          httpsField = aql`httpsScan.hstsAge`
        } else if (orderBy.field === 'preloaded') {
          documentField = aql`beforeVar.preloaded`
          httpsField = aql`httpsScan.preloaded`
        }

        beforeTemplate = aql`
        FILTER ${httpsField} ${beforeTemplateDirection} ${documentField}
        OR (${httpsField} == ${documentField}
        AND TO_NUMBER(httpsScan._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let startDateTemplate = aql``
    if (typeof startDate !== 'undefined') {
      startDateTemplate = aql`
      FILTER DATE_FORMAT(
        DATE_TIMESTAMP(httpsScan.timestamp),
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
        DATE_TIMESTAMP(httpsScan.timestamp),
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadHttpsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`HTTPS\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} tried to have \`first\` and \`last\` arguments set for: loadHttpsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`HTTPS\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadHttpsConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`HTTPS\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadHttpsConnectionsByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting ${amount} records on the \`HTTPS\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(httpsScan._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(httpsScan._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadHttpsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(httpsScan._key) > TO_NUMBER(LAST(retrievedHttps)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(httpsScan._key) < TO_NUMBER(FIRST(retrievedHttps)._key)`
    if (typeof orderBy !== 'undefined') {
      let hasNextPageDirection = aql``
      let hasPreviousPageDirection = aql``
      if (orderBy.direction === 'ASC') {
        hasNextPageDirection = aql`>`
        hasPreviousPageDirection = aql`<`
      } else {
        hasNextPageDirection = aql`<`
        hasPreviousPageDirection = aql`>`
      }
      let httpsField = aql``
      let hasNextPageDocumentField = aql``
      let hasPreviousPageDocumentField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        httpsField = aql`httpsScan.timestamp`
        hasNextPageDocumentField = aql`LAST(retrievedHttps).timestamp`
        hasPreviousPageDocumentField = aql`FIRST(retrievedHttps).timestamp`
      } else if (orderBy.field === 'implementation') {
        httpsField = aql`httpsScan.implementation`
        hasNextPageDocumentField = aql`LAST(retrievedHttps).implementation`
        hasPreviousPageDocumentField = aql`FIRST(retrievedHttps).implementation`
      } else if (orderBy.field === 'enforced') {
        httpsField = aql`httpsScan.enforced`
        hasNextPageDocumentField = aql`LAST(retrievedHttps).enforced`
        hasPreviousPageDocumentField = aql`FIRST(retrievedHttps).enforced`
      } else if (orderBy.field === 'hsts') {
        httpsField = aql`httpsScan.hsts`
        hasNextPageDocumentField = aql`LAST(retrievedHttps).hsts`
        hasPreviousPageDocumentField = aql`FIRST(retrievedHttps).hsts`
      } else if (orderBy.field === 'hsts-age') {
        httpsField = aql`httpsScan.hstsAge`
        hasNextPageDocumentField = aql`LAST(retrievedHttps).hstsAge`
        hasPreviousPageDocumentField = aql`FIRST(retrievedHttps).hstsAge`
      } else if (orderBy.field === 'preloaded') {
        httpsField = aql`httpsScan.preloaded`
        hasNextPageDocumentField = aql`LAST(retrievedHttps).preloaded`
        hasPreviousPageDocumentField = aql`FIRST(retrievedHttps).preloaded`
      }

      hasNextPageFilter = aql`
      FILTER ${httpsField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${httpsField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(httpsScan._key) > TO_NUMBER(LAST(retrievedHttps)._key))
    `
      hasPreviousPageFilter = aql`
      FILTER ${httpsField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${httpsField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(httpsScan._key) < TO_NUMBER(FIRST(retrievedHttps)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'timestamp') {
        sortByField = aql`httpsScan.timestamp ${orderBy.direction},`
      } else if (orderBy.field === 'implementation') {
        sortByField = aql`httpsScan.implementation ${orderBy.direction},`
      } else if (orderBy.field === 'enforced') {
        sortByField = aql`httpsScan.enforced ${orderBy.direction},`
      } else if (orderBy.field === 'hsts') {
        sortByField = aql`httpsScan.hsts ${orderBy.direction},`
      } else if (orderBy.field === 'hsts-age') {
        sortByField = aql`httpsScan.hstsAge ${orderBy.direction},`
      } else if (orderBy.field === 'preloaded') {
        sortByField = aql`httpsScan.preloaded ${orderBy.direction},`
      }
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
      WITH domains, domainsHTTPS, https
      LET httpsKeys = (
        FOR v, e IN 1 OUTBOUND ${domainId} domainsHTTPS
          OPTIONS {bfs: true}
          RETURN v._key
      )

      ${afterVar}
      ${beforeVar}

      LET retrievedHttps = (
        FOR httpsScan IN https
          FILTER httpsScan._key IN httpsKeys
          ${afterTemplate}
          ${beforeTemplate}
          ${startDateTemplate}
          ${endDateTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: httpsScan._key, _type: "https" }, httpsScan)
      )

      LET hasNextPage = (LENGTH(
        FOR httpsScan IN https
          FILTER httpsScan._key IN httpsKeys
          ${hasNextPageFilter}
          SORT ${sortByField} TO_NUMBER(httpsScan._key) ${sortString} LIMIT 1
          RETURN httpsScan
      ) > 0 ? true : false)
      
      LET hasPreviousPage = (LENGTH(
        FOR httpsScan IN https
          FILTER httpsScan._key IN httpsKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} TO_NUMBER(httpsScan._key) ${sortString} LIMIT 1
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
      throw new Error(
        i18n._(t`Unable to load HTTPS scan(s). Please try again.`),
      )
    }

    let httpsScanInfo
    try {
      httpsScanInfo = await requestedHttpsInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get https information for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load HTTPS scan(s). Please try again.`),
      )
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
