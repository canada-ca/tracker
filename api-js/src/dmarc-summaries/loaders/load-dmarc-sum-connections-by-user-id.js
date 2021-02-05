import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const dmarcSumLoaderConnectionsByUserId = (
  query,
  userKey,
  cleanseInput,
  i18n,
  loadStartDateFromPeriod,
) => async ({ after, before, first, last, period, year, orderBy }) => {
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
    if (typeof orderBy === 'undefined') {
      afterTemplate = aql`FILTER TO_NUMBER(summary._key) > TO_NUMBER(${afterId})`
    } else {
      let afterTemplateDirection = aql``
      if (orderBy.direction === 'ASC') {
        afterTemplateDirection = aql`>`
      } else {
        afterTemplateDirection = aql`<`
      }

      let documentField = aql``
      let summaryField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'fail-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.fail`
        summaryField = aql`summary.categoryTotals.fail`
      } else if (orderBy.field === 'pass-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.pass`
        summaryField = aql`summary.categoryTotals.pass`
      } else if (orderBy.field === 'pass-dkim-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.passDkimOnly`
        summaryField = aql`summary.categoryTotals.passDkimOnly`
      } else if (orderBy.field === 'pass-spf-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.passSpfOnly`
        summaryField = aql`summary.categoryTotals.passSpfOnly`
      } else if (orderBy.field === 'fail-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.fail`
        summaryField = aql`summary.categoryPercentages.fail`
      } else if (orderBy.field === 'pass-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.pass`
        summaryField = aql`summary.categoryPercentages.pass`
      } else if (orderBy.field === 'pass-dkim-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.passDkimOnly`
        summaryField = aql`summary.categoryPercentages.passDkimOnly`
      } else if (orderBy.field === 'pass-spf-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.passSpfOnly`
        summaryField = aql`summary.categoryPercentages.passSpfOnly`
      } else if (orderBy.field === 'total-messages') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${afterId}).totalMessages`
        summaryField = aql`summary.totalMessages`
      }

      afterTemplate = aql`
        FILTER ${summaryField} ${afterTemplateDirection} ${documentField}
        OR (${summaryField} == ${documentField}
        AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
      `
    }
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    if (typeof orderBy === 'undefined') {
      beforeTemplate = aql`FILTER TO_NUMBER(summary._key) < TO_NUMBER(${beforeId})`
    } else {
      let beforeTemplateDirection = aql``
      if (orderBy.direction === 'ASC') {
        beforeTemplateDirection = aql`<`
      } else {
        beforeTemplateDirection = aql`>`
      }

      let documentField = aql``
      let summaryField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'fail-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.fail`
        summaryField = aql`summary.categoryTotals.fail`
      } else if (orderBy.field === 'pass-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.pass`
        summaryField = aql`summary.categoryTotals.pass`
      } else if (orderBy.field === 'pass-dkim-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.passDkimOnly`
        summaryField = aql`summary.categoryTotals.passDkimOnly`
      } else if (orderBy.field === 'pass-spf-count') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.passSpfOnly`
        summaryField = aql`summary.categoryTotals.passSpfOnly`
      } else if (orderBy.field === 'fail-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.fail`
        summaryField = aql`summary.categoryPercentages.fail`
      } else if (orderBy.field === 'pass-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.pass`
        summaryField = aql`summary.categoryPercentages.pass`
      } else if (orderBy.field === 'pass-dkim-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.passDkimOnly`
        summaryField = aql`summary.categoryPercentages.passDkimOnly`
      } else if (orderBy.field === 'pass-spf-percentage') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.passSpfOnly`
        summaryField = aql`summary.categoryPercentages.passSpfOnly`
      } else if (orderBy.field === 'total-messages') {
        documentField = aql`DOCUMENT(dmarcSummaries, ${beforeId}).totalMessages`
        summaryField = aql`summary.totalMessages`
      }

      beforeTemplate = aql`
        FILTER ${summaryField} ${beforeTemplateDirection} ${documentField}
        OR (${summaryField} == ${documentField}
        AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
      `
    }
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
      limitTemplate = aql`summary._key ASC LIMIT TO_NUMBER(${first})`
    } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
      limitTemplate = aql`summary._key DESC LIMIT TO_NUMBER(${last})`
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

  let hasNextPageDirection = aql``
  if (typeof orderBy !== 'undefined') {
    if (orderBy.direction === 'ASC') {
      hasNextPageDirection = aql`>`
    } else {
      hasNextPageDirection = aql`<`
    }
  }

  let hasNextPageFilter = aql`FILTER TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key)`
  if (typeof orderBy !== 'undefined') {
    let documentField = aql``
    let summaryField = aql``
    /* istanbul ignore else */
    if (orderBy.field === 'fail-count') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail`
      summaryField = aql`summary.categoryTotals.fail`
    } else if (orderBy.field === 'pass-count') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.pass`
      summaryField = aql`summary.categoryTotals.pass`
    } else if (orderBy.field === 'pass-dkim-count') {
      documentField = aql` DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.passDkimOnly`
      summaryField = aql`summary.categoryTotals.passDkimOnly`
    } else if (orderBy.field === 'pass-spf-count') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.passSpfOnly`
      summaryField = aql`summary.categoryTotals.passSpfOnly`
    } else if (orderBy.field === 'fail-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryPercentages.fail`
      summaryField = aql`summary.categoryPercentages.fail`
    } else if (orderBy.field === 'pass-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryPercentages.pass`
      summaryField = aql`summary.categoryTotals.pass`
    } else if (orderBy.field === 'pass-dkim-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryPercentages.passDkimOnly`
      summaryField = aql`summary.categoryPercentages.passDkimOnly`
    } else if (orderBy.field === 'pass-spf-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryPercentages.passSpfOnly`
      summaryField = aql`summary.categoryPercentages.passSpfOnly`
    } else if (orderBy.field === 'total-messages') {
      documentField = aql`DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).totalMessages`
      summaryField = aql`summary.totalMessages`
    }

    hasNextPageFilter = aql`
      FILTER ${summaryField} ${hasNextPageDirection} ${documentField}
      OR (${summaryField} == ${documentField}
      AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
    `
  }

  let hasPreviousPageDirection = aql``
  if (typeof orderBy !== 'undefined') {
    if (orderBy.direction === 'ASC') {
      hasPreviousPageDirection = aql`<`
    } else {
      hasPreviousPageDirection = aql`>`
    }
  }

  let hasPreviousPageFilter = aql`FILTER TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key)`
  if (typeof orderBy !== 'undefined') {
    let documentField = aql``
    let summaryField = aql``
    /* istanbul ignore else */
    if (orderBy.field === 'fail-count') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.fail`
      summaryField = aql`summary.categoryTotals.fail`
    } else if (orderBy.field === 'pass-count') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.pass`
      summaryField = aql`summary.categoryTotals.pass`
    } else if (orderBy.field === 'pass-dkim-count') {
      documentField = aql` DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.passDkimOnly`
      summaryField = aql`summary.categoryTotals.passDkimOnly`
    } else if (orderBy.field === 'pass-spf-count') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.passSpfOnly`
      summaryField = aql`summary.categoryTotals.passSpfOnly`
    } else if (orderBy.field === 'fail-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.fail`
      summaryField = aql`summary.categoryPercentages.fail`
    } else if (orderBy.field === 'pass-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.pass`
      summaryField = aql`summary.categoryTotals.pass`
    } else if (orderBy.field === 'pass-dkim-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.passDkimOnly`
      summaryField = aql`summary.categoryPercentages.passDkimOnly`
    } else if (orderBy.field === 'pass-spf-percentage') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.passSpfOnly`
      summaryField = aql`summary.categoryPercentages.passSpfOnly`
    } else if (orderBy.field === 'total-messages') {
      documentField = aql`DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).totalMessages`
      summaryField = aql`summary.totalMessages`
    }

    hasPreviousPageFilter = aql`
      FILTER ${summaryField} ${hasPreviousPageDirection} ${documentField}
      OR (${summaryField} == ${documentField}
      AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
    `
  }

  let sortByField = aql``
  if (typeof orderBy !== 'undefined') {
    /* istanbul ignore else */
    if (orderBy.field === 'fail-count') {
      sortByField = aql`summary.categoryTotals.fail ${orderBy.direction},`
    } else if (orderBy.field === 'pass-count') {
      sortByField = aql`summary.categoryTotals.pass ${orderBy.direction},`
    } else if (orderBy.field === 'pass-dkim-count') {
      sortByField = aql`summary.categoryTotals.passDkimOnly ${orderBy.direction},`
    } else if (orderBy.field === 'pass-spf-count') {
      sortByField = aql`summary.categoryTotals.passSpfOnly ${orderBy.direction},`
    } else if (orderBy.field === 'fail-percentage') {
      sortByField = aql`summary.categoryPercentages.fail ${orderBy.direction},`
    } else if (orderBy.field === 'pass-percentage') {
      sortByField = aql`summary.categoryPercentages.pass ${orderBy.direction},`
    } else if (orderBy.field === 'pass-dkim-percentage') {
      sortByField = aql`summary.categoryPercentages.passDkimOnly ${orderBy.direction},`
    } else if (orderBy.field === 'pass-spf-percentage') {
      sortByField = aql`summary.categoryPercentages.passSpfOnly ${orderBy.direction},`
    } else if (orderBy.field === 'total-messages') {
      sortByField = aql`summary.totalMessages ${orderBy.direction},`
    }
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
      FOR summaryId IN summaryIds
        FOR summary IN dmarcSummaries
          FILTER summary._id == summaryId
          LET domain = FIRST(
            FOR v, e IN 1..1 ANY summary._id domainsToDmarcSummaries
              RETURN v
          )
          ${afterTemplate}
          ${beforeTemplate}
          
          SORT
          ${sortByField}
          ${limitTemplate}

          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            domainKey: domain._key,
            categoryTotals: summary.categoryTotals,
            categoryPercentages: summary.categoryPercentages,
            totalMessages: summary.totalMessages
          }
    )

    LET hasNextPage = (LENGTH(
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
        ${hasNextPageFilter}
        SORT ${sortByField} summary._key ${sortString} LIMIT 1
        RETURN summary
    ) > 0 ? true : false)

    LET hasPreviousPage = (LENGTH(
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
        ${hasPreviousPageFilter}
        SORT ${sortByField} summary._key ${sortString} LIMIT 1
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

  const edges = summariesInfo.summaries.map((summary) => {
    summary.startDate = startDate
    return {
      cursor: toGlobalId('dmarcSummaries', summary.id),
      node: summary,
    }
  })

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
