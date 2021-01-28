import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const dmarcSumLoaderConnectionsByUserId = (
  query,
  userKey,
  cleanseInput,
  i18n,
  loadStartDateFromPeriod,
) => async ({ after, before, first, last, period, year }) => {
  const userDBId = `users/${userKey}`

  if (typeof period === 'undefined') {
    console.warn(
      `User: ${userKey} did not have \`period\` argument set for: dmarcSumLoaderConnectionsByUserId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`period\` value to access the \`dmarcSummaries\` connection.`,
      ),
    )
  }
  const cleansedPeriod = cleanseInput(period)

  if (typeof year === 'undefined') {
    console.warn(
      `User: ${userKey} did not have \`year\` argument set for: dmarcSumLoaderConnectionsByUserId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`year\` value to access the \`dmarcSummaries\` connection.`,
      ),
    )
  }
  const cleansedYear = cleanseInput(year)

  const startDate = loadStartDateFromPeriod({
    period: cleansedPeriod,
    year: cleansedYear,
  })

  let afterTemplate = aql``
  if (typeof after !== 'undefined') {
    const { id: afterId } = fromGlobalId(cleanseInput(after))
    afterTemplate = aql`FILTER TO_NUMBER(summary._key) > TO_NUMBER(${afterId})`
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    beforeTemplate = aql`FILTER TO_NUMBER(summary._key) < TO_NUMBER(${beforeId})`
  }

  let limitTemplate = aql``
  if (typeof first === 'undefined' && typeof last === 'undefined') {
    console.warn(
      `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: dmarcSumLoaderConnectionsByUserId.`,
    )
    throw new Error(
      i18n._(
        t`You must provide a \`first\` or \`last\` value to properly paginate the \`dmarcSummaries\` connection.`,
      ),
    )
  } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
    console.warn(
      `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: dmarcSumLoaderConnectionsByUserId.`,
    )
    throw new Error(
      i18n._(
        t`Passing both \`first\` and \`last\` to paginate the \`dmarcSummaries\` connection is not supported.`,
      ),
    )
  } else if (typeof first === 'number' || typeof last === 'number') {
    /* istanbul ignore else */
    if (first < 0 || last < 0) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set below zero for: dmarcSumLoaderConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`\`${argSet}\` on the \`dmarcSummaries\` connection cannot be less than zero.`,
        ),
      )
    } else if (first > 100 || last > 100) {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const amount = typeof first !== 'undefined' ? first : last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: dmarcSumLoaderConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`Requesting \`${amount}\` records on the \`dmarcSummaries\` connection exceeds the \`${argSet}\` limit of 100 records.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
      limitTemplate = aql`SORT summary._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`SORT summary._key DESC LIMIT TO_NUMBER(${last})`
    }
  } else {
    const argSet = typeof first !== 'undefined' ? 'first' : 'last'
    const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
    console.warn(
      `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: dmarcSumLoaderConnectionsByUserId.`,
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

  let requestedSummaryInfo
  try {
    requestedSummaryInfo = await query`
    LET domainIds = UNIQUE(FLATTEN(
      LET ids = []
      LET orgIds = (FOR v, e IN 1..1 ANY ${userDBId} affiliations RETURN e._from)
      FOR orgId IN orgIds
        LET claimDomainIds = (FOR v, e IN 1..1 OUTBOUND orgId ownership RETURN v._id)
        RETURN APPEND(ids, claimDomainIds)
    ))

    LET summaryIds = (
      FOR domainId IN domainIds
        FOR v, e IN 1..1 ANY domainId domainsToDmarcSummaries
          FILTER e.startDate == ${startDate}
          RETURN e._to
    )

    LET retrievedSummaries = (
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
        ${afterTemplate}
        ${beforeTemplate}
        ${limitTemplate}
        RETURN MERGE({ id: summary._key, _type: "dmarcSummary" }, summary)
    )

    LET hasNextPage = (LENGTH(
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
        FILTER TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key)
        SORT summary._key ${sortString} LIMIT 1
        RETURN summary
    ) > 0 ? true : false)

    LET hasPreviousPage = (LENGTH(
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
        FILTER TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key)
        SORT summary._key ${sortString} LIMIT 1
        RETURN summary
    ) > 0 ? true : false)

    RETURN {
      "summaries": retrievedSummaries,
      "totalCount": LENGTH(summaryIds),
      "hasNextPage": hasNextPage,
      "hasPreviousPage": hasPreviousPage,
      "startKey": FIRST(retrievedSummaries)._key,
      "endKey": LAST(retrievedSummaries)._key
    }
    `
  } catch (err) {
    console.error(
      `Database error occurred while user: ${userKey} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load dmarc summaries. Please try again.`),
    )
  }

  let summariesInfo
  try {
    summariesInfo = await requestedSummaryInfo.next()
  } catch (err) {
    console.error(
      `Cursor error occurred while user: ${userKey} was trying to gather dmarc summaries in dmarcSumLoaderConnectionsByUserId, error: ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load dmarc summaries. Please try again.`),
    )
  }

  if (summariesInfo.summaries.length === 0) {
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

  const edges = summariesInfo.summaries.map((summary) => ({
    cursor: toGlobalId('dmarcSummaries', summary.id),
    node: summary,
  }))

  return {
    edges,
    totalCount: summariesInfo.totalCount,
    pageInfo: {
      hasNextPage: summariesInfo.hasNextPage,
      hasPreviousPage: summariesInfo.hasPreviousPage,
      startCursor: toGlobalId('dmarcSummaries', summariesInfo.startKey),
      endCursor: toGlobalId('dmarcSummaries', summariesInfo.endKey),
    },
  }
}
