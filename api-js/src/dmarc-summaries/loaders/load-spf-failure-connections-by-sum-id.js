import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadSpfFailureConnectionsBySumId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ after, before, first, last, summaryId }) => {
    if (typeof summaryId === 'undefined') {
      console.warn(
        `SummaryId was undefined when user: ${userKey} attempted to load spf failures in loadSpfFailureConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(t`Unable to load SPF failure data. Please try again.`),
      )
    }

    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id } = fromGlobalId(cleanseInput(after))
      afterTemplate = aql`FILTER TO_NUMBER(spfFail.id) > TO_NUMBER(${id})`
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id } = fromGlobalId(cleanseInput(before))
      beforeTemplate = aql`FILTER TO_NUMBER(spfFail.id) < TO_NUMBER(${id})`
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadSpfFailureConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`SpfFailureTable\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadSpfFailureConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`SpfFailureTable\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadSpfFailureConnectionsBySumId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`SpfFailureTable\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadSpfFailureConnectionsBySumId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`SpfFailureTable\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`SORT spfFail.id ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`SORT spfFail.id DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadSpfFailureConnectionsBySumId.`,
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

    let requestedSpfFailureInfo
    try {
      requestedSpfFailureInfo = await query`
      WITH dmarcSummaries
      LET spfFailures = FLATTEN(
        FOR summary IN dmarcSummaries
          FILTER summary._id == ${summaryId}
          RETURN summary.detailTables.spfFailure
      )

      LET retrievedSpfFailure = (
        FOR spfFail IN spfFailures
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE({ type: 'spfFail' }, spfFail)
      )

      LET hasNextPage = (LENGTH(
        FOR spfFail IN spfFailures
          FILTER TO_NUMBER(spfFail.id) > TO_NUMBER(LAST(retrievedSpfFailure).id)
          SORT spfFail.id ${sortString} LIMIT 1
          RETURN spfFail
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR spfFail IN spfFailures
          FILTER TO_NUMBER(spfFail.id) < TO_NUMBER(FIRST(retrievedSpfFailure).id)
          SORT spfFail.id ${sortString} LIMIT 1
          RETURN spfFail
      ) > 0 ? true : false)

      RETURN {
        "spfFailures": retrievedSpfFailure,
        "totalCount": LENGTH(spfFailures),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedSpfFailure).id,
        "endKey": LAST(retrievedSpfFailure).id
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather spf failures in loadSpfFailureConnectionsBySumId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load SPF failure data. Please try again.`),
      )
    }

    let spfFailureInfo
    try {
      spfFailureInfo = await requestedSpfFailureInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather spf failures in loadSpfFailureConnectionsBySumId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load SPF failure data. Please try again.`),
      )
    }

    if (spfFailureInfo.spfFailures.length === 0) {
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

    const edges = spfFailureInfo.spfFailures.map((spfFailure) => ({
      cursor: toGlobalId('spfFail', spfFailure.id),
      node: spfFailure,
    }))

    return {
      edges,
      totalCount: spfFailureInfo.totalCount,
      pageInfo: {
        hasNextPage: spfFailureInfo.hasNextPage,
        hasPreviousPage: spfFailureInfo.hasPreviousPage,
        startCursor: toGlobalId('spfFail', spfFailureInfo.startKey),
        endCursor: toGlobalId('spfFail', spfFailureInfo.endKey),
      },
    }
  }
