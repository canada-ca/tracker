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
      /* istanbul ignore else */
      if (typeof orderBy !== 'undefined') {
        if (orderBy.direction === 'ASC') {
          afterTemplateDirection = aql`>`
        } else {
          afterTemplateDirection = aql`<`
        }
      }

      /* istanbul ignore else */
      if (orderBy.field === 'fail-count') {
        afterTemplate = aql`
          FILTER summary.categoryTotals.fail ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.fail
          OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.fail 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'pass-count') {
        afterTemplate = aql`
          FILTER summary.categoryTotals.pass ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.pass 
          OR (summary.categoryTotals.pass == DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.pass 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'pass-dkim-count') {
        afterTemplate = aql`
          FILTER summary.categoryTotals.passDkimOnly ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.passDkimOnly
          OR (summary.categoryTotals.passDkimOnly == DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.passDkimOnly 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'pass-spf-count') {
        afterTemplate = aql`
          FILTER summary.categoryTotals.passSpfOnly ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals.passSpfOnly
          OR (summary.categoryTotals.passSpfOnly == DOCUMENT(dmarcSummaries, ${afterId}).categoryTotals 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'fail-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.fail ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.fail
          OR (summary.categoryPercentages.fail == DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'pass-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.pass ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.pass
          OR (summary.categoryPercentages.pass == DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'pass-dkim-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.passDkimOnly ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.passDkimOnly
          OR (summary.categoryPercentages.passDkimOnly == DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'pass-spf-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.passSpfOnly ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages.passSpfOnly
          OR (summary.categoryPercentages.passSpfOnly == DOCUMENT(dmarcSummaries, ${afterId}).categoryPercentages 
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      } else if (orderBy.field === 'total-messages') {
        afterTemplate = aql`
          FILTER summary.totalMessages ${afterTemplateDirection} DOCUMENT(dmarcSummaries, ${afterId}).totalMessages
          OR (summary.totalMessages == DOCUMENT(dmarcSummaries, ${afterId}).totalMessages
          AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
        `
      }
    }
  }

  let beforeTemplate = aql``
  if (typeof before !== 'undefined') {
    const { id: beforeId } = fromGlobalId(cleanseInput(before))
    if (typeof orderBy === 'undefined') {
      beforeTemplate = aql`FILTER TO_NUMBER(summary._key) < TO_NUMBER(${beforeId})`
    } else {
      let beforeTemplateDirection = aql``
      /* istanbul ignore else */
      if (typeof orderBy !== 'undefined') {
        if (orderBy.direction === 'ASC') {
          beforeTemplateDirection = aql`<`
        } else {
          beforeTemplateDirection = aql`>`
        }
      }

      /* istanbul ignore else */
      if (orderBy.field === 'fail-count') {
        beforeTemplate = aql`
          FILTER summary.categoryTotals.fail ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.fail
          OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.fail
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'pass-count') {
        beforeTemplate = aql`
          FILTER summary.categoryTotals.pass ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.pass 
          OR (summary.categoryTotals.pass == DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.pass
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'pass-dkim-count') {
        beforeTemplate = aql`
          FILTER summary.categoryTotals.passDkimOnly ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.passDkimOnly
          OR (summary.categoryTotals.passDkimOnly == DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.passDkimOnly
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'pass-spf-count') {
        beforeTemplate = aql`
          FILTER summary.categoryTotals.passSpfOnly ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.passSpfOnly
          OR (summary.categoryTotals.passSpfOnly == DOCUMENT(dmarcSummaries, ${beforeId}).categoryTotals.passSpfOnly
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'fail-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.fail ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.fail
          OR (summary.categoryPercentages.fail == DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.fail
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'pass-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.pass ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.pass
          OR (summary.categoryPercentages.pass == DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.pass
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'pass-dkim-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.passDkimOnly ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.passDkimOnly
          OR (summary.categoryPercentages.passDkimOnly == DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.passDkimOnly
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'pass-spf-percentage') {
        afterTemplate = aql`
          FILTER summary.categoryPercentages.passSpfOnly ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.passSpfOnly
          OR (summary.categoryPercentages.passSpfOnly == DOCUMENT(dmarcSummaries, ${beforeId}).categoryPercentages.passSpfOnly
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      } else if (orderBy.field === 'total-messages') {
        afterTemplate = aql`
          FILTER summary.totalMessages ${beforeTemplateDirection} DOCUMENT(dmarcSummaries, ${beforeId}).totalMessages
          OR (summary.totalMessages == DOCUMENT(dmarcSummaries, ${beforeId}).totalMessages
          AND TO_NUMBER(summary._key) < TO_NUMBER(${beforeId}))
        `
      }
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
    /* istanbul ignore else */
    if (orderBy.field === 'fail-count') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-count') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-dkim-count') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-spf-count') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'fail-percentage') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-percentage') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-dkim-percentage') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-spf-percentage') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'total-messages') {
      hasNextPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasNextPageDirection} DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, LAST(retrievedSummaries)._key).categoryTotals.fail 
        AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
      `
    }
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
    /* istanbul ignore else */
    if (orderBy.field === 'fail-count') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryTotals.fail ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.fail
        OR (summary.categoryTotals.fail == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.fail
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-count') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryTotals.pass ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.pass
        OR (summary.categoryTotals.pass == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.pass
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-dkim-count') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryTotals.passDkimOnly ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.passDkimOnly
        OR (summary.categoryTotals.passDkimOnly == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.passDkimOnly
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-spf-count') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryTotals.passSpfOnly ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.passSpfOnly
        OR (summary.categoryTotals.passSpfOnly == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryTotals.passSpfOnly
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'fail-percentage') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryPercentages.fail ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.fail
        OR (summary.categoryPercentages.fail == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.fail
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-percentage') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryPercentages.pass ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.pass
        OR (summary.categoryPercentages.pass == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.pass
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-dkim-percentage') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryPercentages.passDkimOnly ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.passDkimOnly
        OR (summary.categoryPercentages.passDkimOnly == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.passDkimOnly
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'pass-spf-percentage') {
      hasPreviousPageFilter = aql`
        FILTER summary.categoryPercentages.passSpfOnly ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.passSpfOnly
        OR (summary.categoryPercentages.fail == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).categoryPercentages.passSpfOnly
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    } else if (orderBy.field === 'total-messages') {
      hasPreviousPageFilter = aql`
        FILTER summary.totalMessages ${hasPreviousPageDirection} DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).totalMessages
        OR (summary.totalMessages == DOCUMENT(dmarcSummaries, FIRST(retrievedSummaries)._key).totalMessages
        AND TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key))
      `
    }
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
