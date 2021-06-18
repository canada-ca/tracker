import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadSslConnectionByDomainId =
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
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(sslScan._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        let documentField = aql``
        let sslField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acceptable-ciphers') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).acceptable_ciphers`
          sslField = aql`sslScan.acceptable_ciphers`
        } else if (orderBy.field === 'acceptable-curves') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).acceptable_curves`
          sslField = aql`sslScan.acceptable_curves`
        } else if (orderBy.field === 'ccs-injection-vulnerable') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).ccs_injection_vulnerable`
          sslField = aql`sslScan.ccs_injection_vulnerable`
        } else if (orderBy.field === 'heartbleed-vulnerable') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).heartbleed_vulnerable`
          sslField = aql`sslScan.heartbleed_vulnerable`
        } else if (orderBy.field === 'strong-ciphers') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).strong_ciphers`
          sslField = aql`sslScan.strong_ciphers`
        } else if (orderBy.field === 'strong-curves') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).strong_curves`
          sslField = aql`sslScan.strong_curves`
        } else if (orderBy.field === 'supports-ecdh-key-exchange') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).supports_ecdh_key_exchange`
          sslField = aql`sslScan.supports_ecdh_key_exchange`
        } else if (orderBy.field === 'timestamp') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).timestamp`
          sslField = aql`sslScan.timestamp`
        } else if (orderBy.field === 'weak-ciphers') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).weak_ciphers`
          sslField = aql`sslScan.weak_ciphers`
        } else if (orderBy.field === 'weak-curves') {
          documentField = aql`DOCUMENT(ssl, ${afterId}).weak_curves`
          sslField = aql`sslScan.weak_curves`
        }

        afterTemplate = aql`
        FILTER ${sslField} ${afterTemplateDirection} ${documentField}
        OR (${sslField} == ${documentField}
        AND TO_NUMBER(sslScan._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(sslScan._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection = aql``
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        let documentField = aql``
        let sslField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'acceptable-ciphers') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).acceptable_ciphers`
          sslField = aql`sslScan.acceptable_ciphers`
        } else if (orderBy.field === 'acceptable-curves') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).acceptable_curves`
          sslField = aql`sslScan.acceptable_curves`
        } else if (orderBy.field === 'ccs-injection-vulnerable') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).ccs_injection_vulnerable`
          sslField = aql`sslScan.ccs_injection_vulnerable`
        } else if (orderBy.field === 'heartbleed-vulnerable') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).heartbleed_vulnerable`
          sslField = aql`sslScan.heartbleed_vulnerable`
        } else if (orderBy.field === 'strong-ciphers') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).strong_ciphers`
          sslField = aql`sslScan.strong_ciphers`
        } else if (orderBy.field === 'strong-curves') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).strong_curves`
          sslField = aql`sslScan.strong_curves`
        } else if (orderBy.field === 'supports-ecdh-key-exchange') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).supports_ecdh_key_exchange`
          sslField = aql`sslScan.supports_ecdh_key_exchange`
        } else if (orderBy.field === 'timestamp') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).timestamp`
          sslField = aql`sslScan.timestamp`
        } else if (orderBy.field === 'weak-ciphers') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).weak_ciphers`
          sslField = aql`sslScan.weak_ciphers`
        } else if (orderBy.field === 'weak-curves') {
          documentField = aql`DOCUMENT(ssl, ${beforeId}).weak_curves`
          sslField = aql`sslScan.weak_curves`
        }

        beforeTemplate = aql`
        FILTER ${sslField} ${beforeTemplateDirection} ${documentField}
        OR (${sslField} == ${documentField}
        AND TO_NUMBER(sslScan._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let startDateTemplate = aql``
    if (typeof startDate !== 'undefined') {
      startDateTemplate = aql`
      FILTER DATE_FORMAT(
        DATE_TIMESTAMP(sslScan.timestamp),
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
        DATE_TIMESTAMP(sslScan.timestamp),
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadSslConnectionByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`SSL\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} tried to have \`first\` and \`last\` arguments set for: loadSslConnectionByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`SSL\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadSslConnectionByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`SSL\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadSslConnectionByDomainId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting ${amount} records on the \`SSL\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`sslScan._key ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`sslScan._key DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadSslConnectionByDomainId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(sslScan._key) > TO_NUMBER(LAST(retrievedSsl)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(sslScan._key) < TO_NUMBER(FIRST(retrievedSsl)._key)`
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

      let sslField, hasNextPageDocument, hasPreviousPageDocument
      /* istanbul ignore else */
      if (orderBy.field === 'acceptable-ciphers') {
        sslField = aql`sslScan.acceptable_ciphers`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).acceptable_ciphers`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).acceptable_ciphers`
      } else if (orderBy.field === 'acceptable-curves') {
        sslField = aql`sslScan.acceptable_curves`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).acceptable_curves`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).acceptable_curves`
      } else if (orderBy.field === 'ccs-injection-vulnerable') {
        sslField = aql`sslScan.ccs_injection_vulnerable`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).ccs_injection_vulnerable`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).ccs_injection_vulnerable`
      } else if (orderBy.field === 'heartbleed-vulnerable') {
        sslField = aql`sslScan.heartbleed_vulnerable`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).heartbleed_vulnerable`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).heartbleed_vulnerable`
      } else if (orderBy.field === 'strong-ciphers') {
        sslField = aql`sslScan.strong_ciphers`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).strong_ciphers`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).strong_ciphers`
      } else if (orderBy.field === 'strong-curves') {
        sslField = aql`sslScan.strong_curves`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).strong_curves`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).strong_curves`
      } else if (orderBy.field === 'supports-ecdh-key-exchange') {
        sslField = aql`sslScan.supports_ecdh_key_exchange`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).supports_ecdh_key_exchange`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).supports_ecdh_key_exchange`
      } else if (orderBy.field === 'timestamp') {
        sslField = aql`sslScan.timestamp`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).timestamp`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).timestamp`
      } else if (orderBy.field === 'weak-ciphers') {
        sslField = aql`sslScan.weak_ciphers`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).weak_ciphers`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).weak_ciphers`
      } else if (orderBy.field === 'weak-curves') {
        sslField = aql`sslScan.weak_curves`
        hasNextPageDocument = aql`DOCUMENT(ssl, LAST(retrievedSsl)._key).weak_curves`
        hasPreviousPageDocument = aql`DOCUMENT(ssl, FIRST(retrievedSsl)._key).weak_curves`
      }

      hasNextPageFilter = aql`
      FILTER ${sslField} ${hasNextPageDirection} ${hasNextPageDocument}
      OR (${sslField} == ${hasNextPageDocument}
      AND TO_NUMBER(sslScan._key) > TO_NUMBER(LAST(retrievedSsl)._key))
    `

      hasPreviousPageFilter = aql`
      FILTER ${sslField} ${hasPreviousPageDirection} ${hasPreviousPageDocument}
      OR (${sslField} == ${hasPreviousPageDocument}
      AND TO_NUMBER(sslScan._key) < TO_NUMBER(FIRST(retrievedSsl)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'acceptable-ciphers') {
        sortByField = aql`sslScan.acceptable_ciphers ${orderBy.direction},`
      } else if (orderBy.field === 'acceptable-curves') {
        sortByField = aql`sslScan.acceptable_curves ${orderBy.direction},`
      } else if (orderBy.field === 'ccs-injection-vulnerable') {
        sortByField = aql`sslScan.ccs_injection_vulnerable ${orderBy.direction},`
      } else if (orderBy.field === 'heartbleed-vulnerable') {
        sortByField = aql`sslScan.heartbleed_vulnerable ${orderBy.direction},`
      } else if (orderBy.field === 'strong-ciphers') {
        sortByField = aql`sslScan.strong_ciphers ${orderBy.direction},`
      } else if (orderBy.field === 'strong-curves') {
        sortByField = aql`sslScan.strong_curves ${orderBy.direction},`
      } else if (orderBy.field === 'supports-ecdh-key-exchange') {
        sortByField = aql`sslScan.supports_ecdh_key_exchange ${orderBy.direction},`
      } else if (orderBy.field === 'timestamp') {
        sortByField = aql`sslScan.timestamp ${orderBy.direction},`
      } else if (orderBy.field === 'weak-ciphers') {
        sortByField = aql`sslScan.weak_ciphers ${orderBy.direction},`
      } else if (orderBy.field === 'weak-curves') {
        sortByField = aql`sslScan.weak_curves ${orderBy.direction},`
      }
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
      WITH domains, domainsSSL, ssl
      LET sslKeys = (FOR v, e IN 1 OUTBOUND ${domainId} domainsSSL RETURN v._key)

      LET retrievedSsl = (
        FOR sslScan IN ssl
          FILTER sslScan._key IN sslKeys
          ${afterTemplate}
          ${beforeTemplate}
          ${startDateTemplate}
          ${endDateTemplate}
          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: sslScan._key, _type: "ssl" }, sslScan)
      )

      LET hasNextPage = (LENGTH(
        FOR sslScan IN ssl
          FILTER sslScan._key IN sslKeys
          ${hasNextPageFilter}
          SORT ${sortByField} sslScan._key ${sortString} LIMIT 1
          RETURN sslScan
      ) > 0 ? true : false)
      
      LET hasPreviousPage = (LENGTH(
        FOR sslScan IN ssl
          FILTER sslScan._key IN sslKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} sslScan._key ${sortString} LIMIT 1
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
      throw new Error(i18n._(t`Unable to load SSL scan(s). Please try again.`))
    }

    let sslScansInfo
    try {
      sslScansInfo = await requestedSslInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get ssl information for ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load SSL scan(s). Please try again.`))
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
