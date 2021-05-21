import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDmarcFailConnectionsBySumId = ({
  query,
  userKey,
  cleanseInput,
  i18n,
}) => async ({ after, before, first, last, summaryId }) => {
  if (typeof summaryId === 'undefined') {
    console.warn(
      `SummaryId was undefined when user: ${userKey} attempted to load dmarc failures in loadDmarcFailConnectionsBySumId.`,
    )
    throw new Error(
      i18n._(t`Unable to load DMARC failure data. Please try again.`),
    )
  }

  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(dmarcFail.id) > TO_NUMBER(${id})`
  }

  let beforeTemplate
  if (typeof before !== 'undefined') {
    const { id } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(dmarcFail.id) < TO_NUMBER(${id})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDmarcFailConnectionsBySumId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`DmarcFailureTable\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDmarcFailConnectionsBySumId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`DmarcFailureTable\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDmarcFailConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`DmarcFailureTable\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDmarcFailConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`DmarcFailureTable\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT dmarcFail.id ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT dmarcFail.id DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDmarcFailConnectionsBySumId.`,
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

  let requestedDmarcFailureInfo
  try {
    requestedDmarcFailureInfo = await query`
      WITH dmarcSummaries
      
      LET dmarcFailures = FLATTEN(
        FOR summary IN dmarcSummaries
          FILTER summary._id == ${summaryId}
          RETURN summary.detailTables.dmarcFailure
      )

      LET retrievedDmarcFailure = (
        FOR dmarcFail in dmarcFailures
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE({ type: 'dmarcFail' }, dmarcFail)
      )

      LET hasNextPage = (LENGTH(
        FOR dmarcFail IN dmarcFailures
          FILTER TO_NUMBER(dmarcFail.id) > TO_NUMBER(LAST(retrievedDmarcFailure).id)
          SORT dmarcFail.id ${sortString} LIMIT 1
          RETURN dmarcFail
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR dmarcFail IN dmarcFailures
          FILTER TO_NUMBER(dmarcFail.id) < TO_NUMBER(FIRST(retrievedDmarcFailure).id)
          SORT dmarcFail.id ${sortString} LIMIT 1
          RETURN dmarcFail
      ) > 0 ? true : false)

      RETURN {
        "dmarcFailures": retrievedDmarcFailure,
        "totalCount": LENGTH(dmarcFailures),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedDmarcFailure).id,
        "endKey": LAST(retrievedDmarcFailure).id,
      }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to gather dmarc failures in loadDmarcFailConnectionsBySumId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load DMARC failure data. Please try again.`),
    )
  }

  let dmarcFailureInfo
  try {
    dmarcFailureInfo = await requestedDmarcFailureInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to gather dmarc failures in loadDmarcFailConnectionsBySumId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load DMARC failure data. Please try again.`),
    )
  }

  if (dmarcFailureInfo.dmarcFailures.length === 0) {
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

  const edges = dmarcFailureInfo.dmarcFailures.map((dmarcFailure) => ({
    cursor: toGlobalId('dmarcFail', dmarcFailure.id),
    node: dmarcFailure,
  }))

  return {
    edges,
    totalCount: dmarcFailureInfo.totalCount,
    pageInfo: {
      hasNextPage: dmarcFailureInfo.hasNextPage,
      hasPreviousPage: dmarcFailureInfo.hasPreviousPage,
      startCursor: toGlobalId('dmarcFail', dmarcFailureInfo.startKey),
      endCursor: toGlobalId('dmarcFail', dmarcFailureInfo.endKey),
    },
  }
}
