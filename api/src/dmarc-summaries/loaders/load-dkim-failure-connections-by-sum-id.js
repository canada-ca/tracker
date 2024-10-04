import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDkimFailConnectionsBySumId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ after, before, first, last, summaryId }) => {
    if (typeof summaryId === 'undefined') {
      console.warn(
        `SummaryId was undefined when user: ${userKey} attempted to load dkim failures in loadDkimFailConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(t`Unable to load DKIM failure data. Please try again.`),
      )
    }

    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id } = fromGlobalId(cleanseInput(after))
      afterTemplate = aql`FILTER TO_NUMBER(dkimFail.id) > TO_NUMBER(${id})`
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id } = fromGlobalId(cleanseInput(before))
      beforeTemplate = aql`FILTER TO_NUMBER(dkimFail.id) < TO_NUMBER(${id})`
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDkimFailConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`DkimFailureTable\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDkimFailConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`DkimFailureTable\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDkimFailConnectionsBySumId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`DkimFailureTable\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDkimFailConnectionsBySumId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`DkimFailureTable\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`SORT TO_NUMBER(dkimFail.id) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`SORT TO_NUMBER(dkimFail.id) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDkimFailConnectionsBySumId.`,
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

    let requestedDkimFailureInfo
    try {
      requestedDkimFailureInfo = await query`
      WITH dmarcSummaries

      LET dkimFailures = FLATTEN(
        FOR summary IN dmarcSummaries
          FILTER summary._id == ${summaryId}
          RETURN summary.detailTables.dkimFailure
      )

      LET retrievedDkimFailure = (
        FOR dkimFail IN dkimFailures
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE({ type: 'dkimFail' }, dkimFail)
      )

      LET hasNextPage = (LENGTH(
        FOR dkimFail IN dkimFailures
          FILTER TO_NUMBER(dkimFail.id) > TO_NUMBER(LAST(retrievedDkimFailure).id)
          SORT TO_NUMBER(dkimFail.id) ${sortString} LIMIT 1
          RETURN dkimFail
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR dkimFail IN dkimFailures
          FILTER TO_NUMBER(dkimFail.id) < TO_NUMBER(FIRST(retrievedDkimFailure).id)
          SORT TO_NUMBER(dkimFail.id) ${sortString} LIMIT 1
          RETURN dkimFail
      ) > 0 ? true : false)

      RETURN {
        "dkimFailures": retrievedDkimFailure,
        "totalCount": LENGTH(dkimFailures),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedDkimFailure).id,
        "endKey": LAST(retrievedDkimFailure).id
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather dkim failures in loadDkimFailConnectionsBySumId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DKIM failure data. Please try again.`),
      )
    }

    let dkimFailureInfo
    try {
      dkimFailureInfo = await requestedDkimFailureInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather dkim failures in loadDkimFailConnectionsBySumId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DKIM failure data. Please try again.`),
      )
    }

    if (dkimFailureInfo.dkimFailures.length === 0) {
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

    const edges = dkimFailureInfo.dkimFailures.map((dkimFailure) => ({
      cursor: toGlobalId('dkimFail', dkimFailure.id),
      node: dkimFailure,
    }))

    return {
      edges,
      totalCount: dkimFailureInfo.totalCount,
      pageInfo: {
        hasNextPage: dkimFailureInfo.hasNextPage,
        hasPreviousPage: dkimFailureInfo.hasPreviousPage,
        startCursor: toGlobalId('dkimFail', dkimFailureInfo.startKey),
        endCursor: toGlobalId('dkimFail', dkimFailureInfo.endKey),
      },
    }
  }
