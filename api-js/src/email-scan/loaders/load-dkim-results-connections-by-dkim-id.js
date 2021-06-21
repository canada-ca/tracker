import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDkimResultConnectionsByDkimId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ dkimId, after, before, first, last, orderBy }) => {
    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id: afterId } = fromGlobalId(cleanseInput(after))
      if (typeof orderBy === 'undefined') {
        afterTemplate = aql`FILTER TO_NUMBER(dkimResult._key) > TO_NUMBER(${afterId})`
      } else {
        let afterTemplateDirection
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }

        let dkimResultField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'selector') {
          dkimResultField = aql`dkimResult.selector`
          documentField = aql`DOCUMENT(dkimResults, ${afterId}).selector`
        } else if (orderBy.field === 'record') {
          dkimResultField = aql`dkimResult.record`
          documentField = aql`DOCUMENT(dkimResults, ${afterId}).record`
        } else if (orderBy.field === 'key-length') {
          dkimResultField = aql`dkimResult.keyLength`
          documentField = aql`DOCUMENT(dkimResults, ${afterId}).keyLength`
        }

        afterTemplate = aql`
        FILTER ${dkimResultField} ${afterTemplateDirection} ${documentField}
        OR (${dkimResultField} == ${documentField}
        AND TO_NUMBER(dkimResult._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id: beforeId } = fromGlobalId(cleanseInput(before))
      if (typeof orderBy === 'undefined') {
        beforeTemplate = aql`FILTER TO_NUMBER(dkimResult._key) < TO_NUMBER(${beforeId})`
      } else {
        let beforeTemplateDirection
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }

        let dkimResultField, documentField
        /* istanbul ignore else */
        if (orderBy.field === 'selector') {
          dkimResultField = aql`dkimResult.selector`
          documentField = aql`DOCUMENT(dkimResults, ${beforeId}).selector`
        } else if (orderBy.field === 'record') {
          dkimResultField = aql`dkimResult.record`
          documentField = aql`DOCUMENT(dkimResults, ${beforeId}).record`
        } else if (orderBy.field === 'key-length') {
          dkimResultField = aql`dkimResult.keyLength`
          documentField = aql`DOCUMENT(dkimResults, ${beforeId}).keyLength`
        }

        beforeTemplate = aql`
        FILTER ${dkimResultField} ${beforeTemplateDirection} ${documentField}
        OR (${dkimResultField} == ${documentField}
        AND TO_NUMBER(dkimResult._key) < TO_NUMBER(${beforeId}))
      `
      }
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDkimResultConnectionsByDkimId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`DKIMResults\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDkimResultConnectionsByDkimId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`DKIMResults\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDkimResultConnectionsByDkimId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`DKIMResults\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDkimResultConnectionsByDkimId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting ${amount} records on the \`DKIMResults\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`dkimResult._key ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`dkimResult._key DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDkimResultConnectionsByDkimId.`,
      )
      throw new Error(
        i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`),
      )
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(dkimResult._key) > TO_NUMBER(LAST(retrievedDkimResults)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(dkimResult._key) < TO_NUMBER(FIRST(retrievedDkimResults)._key)`
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

      let dkimResultField,
        hasNextPageDocumentField,
        hasPreviousPageDocumentField
      /* istanbul ignore else */
      if (orderBy.field === 'selector') {
        dkimResultField = aql`dkimResult.selector`
        hasNextPageDocumentField = aql`DOCUMENT(dkimResults, LAST(retrievedDkimResults)._key).selector`
        hasPreviousPageDocumentField = aql`DOCUMENT(dkimResults, FIRST(retrievedDkimResults)._key).selector`
      } else if (orderBy.field === 'record') {
        dkimResultField = aql`dkimResult.record`
        hasNextPageDocumentField = aql`DOCUMENT(dkimResults, LAST(retrievedDkimResults)._key).record`
        hasPreviousPageDocumentField = aql`DOCUMENT(dkimResults, FIRST(retrievedDkimResults)._key).record`
      } else if (orderBy.field === 'key-length') {
        dkimResultField = aql`dkimResult.keyLength`
        hasNextPageDocumentField = aql`DOCUMENT(dkimResults, LAST(retrievedDkimResults)._key).keyLength`
        hasPreviousPageDocumentField = aql`DOCUMENT(dkimResults, FIRST(retrievedDkimResults)._key).keyLength`
      }

      hasNextPageFilter = aql`
      FILTER ${dkimResultField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${dkimResultField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(dkimResult._key) > TO_NUMBER(LAST(retrievedDkimResults)._key))
    `

      hasPreviousPageFilter = aql`
      FILTER ${dkimResultField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${dkimResultField} == ${hasPreviousPageDocumentField}
      AND TO_NUMBER(dkimResult._key) < TO_NUMBER(FIRST(retrievedDkimResults)._key))
    `
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      /* istanbul ignore else */
      if (orderBy.field === 'selector') {
        sortByField = aql`dkimResult.selector ${orderBy.direction},`
      } else if (orderBy.field === 'record') {
        sortByField = aql`dkimResult.record ${orderBy.direction},`
      } else if (orderBy.field === 'key-length') {
        sortByField = aql`dkimResult.keyLength ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let dkimResultsCursor
    try {
      dkimResultsCursor = await query`
      WITH dkim, dkimResults, dkimToDkimResults
      LET dkimResultKeys = (FOR v, e IN 1 OUTBOUND ${dkimId} dkimToDkimResults RETURN v._key)

      LET retrievedDkimResults = (
        FOR dkimResult IN dkimResults
          FILTER dkimResult._key IN dkimResultKeys
          ${afterTemplate}
          ${beforeTemplate}

          SORT
          ${sortByField}
          ${limitTemplate}
          RETURN MERGE({ id: dkimResult._key, _type: "dkimResult" }, dkimResult)
      )

      LET hasNextPage = (LENGTH(
        FOR dkimResult IN dkimResults
          FILTER dkimResult._key IN dkimResultKeys
          ${hasNextPageFilter}
          SORT ${sortByField} dkimResult._key ${sortString} LIMIT 1
          RETURN dkimResult
      ) > 0 ? true : false)
      
      LET hasPreviousPage = (LENGTH(
        FOR dkimResult IN dkimResults
          FILTER dkimResult._key IN dkimResultKeys
          ${hasPreviousPageFilter}
          SORT ${sortByField} dkimResult._key ${sortString} LIMIT 1
          RETURN dkimResult
      ) > 0 ? true : false)

      RETURN { 
        "dkimResults": retrievedDkimResults,
        "totalCount": LENGTH(dkimResultKeys),
        "hasNextPage": hasNextPage, 
        "hasPreviousPage": hasPreviousPage, 
        "startKey": FIRST(retrievedDkimResults)._key, 
        "endKey": LAST(retrievedDkimResults)._key 
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get dkim result information for ${dkimId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DKIM result(s). Please try again.`),
      )
    }

    let dkimResultsInfo
    try {
      dkimResultsInfo = await dkimResultsCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get dkim result information for ${dkimId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DKIM result(s). Please try again.`),
      )
    }

    if (dkimResultsInfo.dkimResults.length === 0) {
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

    const edges = dkimResultsInfo.dkimResults.map((dkimResult) => {
      dkimResult.dkimId = dkimId
      return {
        cursor: toGlobalId('dkimResult', dkimResult._key),
        node: dkimResult,
      }
    })

    return {
      edges,
      totalCount: dkimResultsInfo.totalCount,
      pageInfo: {
        hasNextPage: dkimResultsInfo.hasNextPage,
        hasPreviousPage: dkimResultsInfo.hasPreviousPage,
        startCursor: toGlobalId('dkimResult', dkimResultsInfo.startKey),
        endCursor: toGlobalId('dkimResult', dkimResultsInfo.endKey),
      },
    }
  }
