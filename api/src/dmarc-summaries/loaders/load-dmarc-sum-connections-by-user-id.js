import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDmarcSummaryConnectionsByUserId =
  ({ query, userKey, cleanseInput, i18n, loadStartDateFromPeriod }) =>
  async ({ after, before, first, last, period, year, orderBy, isSuperAdmin, search, isAffiliated }) => {
    const userDBId = `users/${userKey}`

    if (typeof period === 'undefined') {
      console.warn(`User: ${userKey} did not have \`period\` argument set for: loadDmarcSummaryConnectionsByUserId.`)
      throw new Error(i18n._(t`You must provide a \`period\` value to access the \`DmarcSummaries\` connection.`))
    }
    const cleansedPeriod = cleanseInput(period)

    if (typeof year === 'undefined') {
      console.warn(`User: ${userKey} did not have \`year\` argument set for: loadDmarcSummaryConnectionsByUserId.`)
      throw new Error(i18n._(t`You must provide a \`year\` value to access the \`DmarcSummaries\` connection.`))
    }
    const cleansedYear = cleanseInput(year)

    const startDate = loadStartDateFromPeriod({
      period: cleansedPeriod,
      year: cleansedYear,
    })

    let afterTemplate = aql``
    let afterVar = aql``
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

        afterVar = aql`LET afterVar = DOCUMENT(dmarcSummaries, ${afterId})`

        let documentField = aql``
        let summaryField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'fail-count') {
          documentField = aql`afterVar.categoryTotals.fail`
          summaryField = aql`summary.categoryTotals.fail`
        } else if (orderBy.field === 'pass-count') {
          documentField = aql`afterVar.categoryTotals.pass`
          summaryField = aql`summary.categoryTotals.pass`
        } else if (orderBy.field === 'pass-dkim-count') {
          documentField = aql`afterVar.categoryTotals.passDkimOnly`
          summaryField = aql`summary.categoryTotals.passDkimOnly`
        } else if (orderBy.field === 'pass-spf-count') {
          documentField = aql`afterVar.categoryTotals.passSpfOnly`
          summaryField = aql`summary.categoryTotals.passSpfOnly`
        } else if (orderBy.field === 'fail-percentage') {
          documentField = aql`afterVar.categoryPercentages.fail`
          summaryField = aql`summary.categoryPercentages.fail`
        } else if (orderBy.field === 'pass-percentage') {
          documentField = aql`afterVar.categoryPercentages.pass`
          summaryField = aql`summary.categoryPercentages.pass`
        } else if (orderBy.field === 'pass-dkim-percentage') {
          documentField = aql`afterVar.categoryPercentages.passDkimOnly`
          summaryField = aql`summary.categoryPercentages.passDkimOnly`
        } else if (orderBy.field === 'pass-spf-percentage') {
          documentField = aql`afterVar.categoryPercentages.passSpfOnly`
          summaryField = aql`summary.categoryPercentages.passSpfOnly`
        } else if (orderBy.field === 'total-messages') {
          documentField = aql`afterVar.totalMessages`
          summaryField = aql`summary.totalMessages`
        } else if (orderBy.field === 'domain') {
          documentField = aql`
          FIRST(
            FOR v, e IN 1..1 ANY afterVar._id domainsToDmarcSummaries
            RETURN v.domain
          )
        `
          summaryField = aql`domain.domain`
        }

        afterTemplate = aql`
        FILTER ${summaryField} ${afterTemplateDirection} ${documentField}
        OR (${summaryField} == ${documentField}
        AND TO_NUMBER(summary._key) > TO_NUMBER(${afterId}))
      `
      }
    }

    let beforeTemplate = aql``
    let beforeVar = aql``
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

        beforeVar = aql`LET beforeVar = DOCUMENT(dmarcSummaries, ${beforeId})`

        let documentField = aql``
        let summaryField = aql``
        /* istanbul ignore else */
        if (orderBy.field === 'fail-count') {
          documentField = aql`beforeVar.categoryTotals.fail`
          summaryField = aql`summary.categoryTotals.fail`
        } else if (orderBy.field === 'pass-count') {
          documentField = aql`beforeVar.categoryTotals.pass`
          summaryField = aql`summary.categoryTotals.pass`
        } else if (orderBy.field === 'pass-dkim-count') {
          documentField = aql`beforeVar.categoryTotals.passDkimOnly`
          summaryField = aql`summary.categoryTotals.passDkimOnly`
        } else if (orderBy.field === 'pass-spf-count') {
          documentField = aql`beforeVar.categoryTotals.passSpfOnly`
          summaryField = aql`summary.categoryTotals.passSpfOnly`
        } else if (orderBy.field === 'fail-percentage') {
          documentField = aql`beforeVar.categoryPercentages.fail`
          summaryField = aql`summary.categoryPercentages.fail`
        } else if (orderBy.field === 'pass-percentage') {
          documentField = aql`beforeVar.categoryPercentages.pass`
          summaryField = aql`summary.categoryPercentages.pass`
        } else if (orderBy.field === 'pass-dkim-percentage') {
          documentField = aql`beforeVar.categoryPercentages.passDkimOnly`
          summaryField = aql`summary.categoryPercentages.passDkimOnly`
        } else if (orderBy.field === 'pass-spf-percentage') {
          documentField = aql`beforeVar.categoryPercentages.passSpfOnly`
          summaryField = aql`summary.categoryPercentages.passSpfOnly`
        } else if (orderBy.field === 'total-messages') {
          documentField = aql`beforeVar.totalMessages`
          summaryField = aql`summary.totalMessages`
        } else if (orderBy.field === 'domain') {
          documentField = aql`
          FIRST(
            FOR v, e IN 1..1 ANY beforeVar._id domainsToDmarcSummaries
            RETURN v.domain
          )
        `
          summaryField = aql`domain.domain`
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
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadDmarcSummaryConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`DmarcSummaries\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadDmarcSummaryConnectionsByUserId.`,
      )
      throw new Error(
        i18n._(t`Passing both \`first\` and \`last\` to paginate the \`DmarcSummaries\` connection is not supported.`),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadDmarcSummaryConnectionsByUserId.`,
        )
        throw new Error(i18n._(t`\`${argSet}\` on the \`DmarcSummaries\` connection cannot be less than zero.`))
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadDmarcSummaryConnectionsByUserId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`DmarcSummaries\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`TO_NUMBER(summary._key) ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`TO_NUMBER(summary._key) DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadDmarcSummaryConnectionsByUserId.`,
      )
      throw new Error(i18n._(t`\`${argSet}\` must be of type \`number\` not \`${typeSet}\`.`))
    }

    let hasNextPageFilter = aql`FILTER TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key)`
    let hasPreviousPageFilter = aql`FILTER TO_NUMBER(summary._key) < TO_NUMBER(FIRST(retrievedSummaries)._key)`
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

      let hasNextPageDocumentField = aql``
      let summaryField = aql``
      let hasPreviousPageDocumentField = aql``
      /* istanbul ignore else */
      if (orderBy.field === 'fail-count') {
        summaryField = aql`summary.categoryTotals.fail`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryTotals.fail`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryTotals.fail`
      } else if (orderBy.field === 'pass-count') {
        summaryField = aql`summary.categoryTotals.pass`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryTotals.pass`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryTotals.pass`
      } else if (orderBy.field === 'pass-dkim-count') {
        summaryField = aql`summary.categoryTotals.passDkimOnly`
        hasNextPageDocumentField = aql` LAST(retrievedSummaries).categoryTotals.passDkimOnly`
        hasPreviousPageDocumentField = aql` FIRST(retrievedSummaries).categoryTotals.passDkimOnly`
      } else if (orderBy.field === 'pass-spf-count') {
        summaryField = aql`summary.categoryTotals.passSpfOnly`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryTotals.passSpfOnly`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryTotals.passSpfOnly`
      } else if (orderBy.field === 'fail-percentage') {
        summaryField = aql`summary.categoryPercentages.fail`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryPercentages.fail`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryPercentages.fail`
      } else if (orderBy.field === 'pass-percentage') {
        summaryField = aql`summary.categoryPercentages.pass`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryPercentages.pass`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryPercentages.pass`
      } else if (orderBy.field === 'pass-dkim-percentage') {
        summaryField = aql`summary.categoryPercentages.passDkimOnly`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryPercentages.passDkimOnly`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryPercentages.passDkimOnly`
      } else if (orderBy.field === 'pass-spf-percentage') {
        summaryField = aql`summary.categoryPercentages.passSpfOnly`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).categoryPercentages.passSpfOnly`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).categoryPercentages.passSpfOnly`
      } else if (orderBy.field === 'total-messages') {
        summaryField = aql`summary.totalMessages`
        hasNextPageDocumentField = aql`LAST(retrievedSummaries).totalMessages`
        hasPreviousPageDocumentField = aql`FIRST(retrievedSummaries).totalMessages`
      } else if (orderBy.field === 'domain') {
        summaryField = aql`domain.domain`
        hasNextPageDocumentField = aql`
        FIRST(
          FOR v, e IN 1..1 ANY LAST(retrievedSummaries)._id domainsToDmarcSummaries
          RETURN v.domain
        )
      `
        hasPreviousPageDocumentField = aql`
        FIRST(
          FOR v, e IN 1..1 ANY FIRST(retrievedSummaries)._id domainsToDmarcSummaries
          RETURN v.domain
        )
      `
      }

      hasNextPageFilter = aql`
      FILTER ${summaryField} ${hasNextPageDirection} ${hasNextPageDocumentField}
      OR (${summaryField} == ${hasNextPageDocumentField}
      AND TO_NUMBER(summary._key) > TO_NUMBER(LAST(retrievedSummaries)._key))
    `
      hasPreviousPageFilter = aql`
      FILTER ${summaryField} ${hasPreviousPageDirection} ${hasPreviousPageDocumentField}
      OR (${summaryField} == ${hasPreviousPageDocumentField}
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
      } else if (orderBy.field === 'domain') {
        sortByField = aql`domain.domain ${orderBy.direction},`
      }
    }

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`ASC`
    }

    let searchDomainFilter = aql``
    if (typeof search !== 'undefined' && search !== '') {
      search = cleanseInput(search)
      searchDomainFilter = aql`FILTER userDomain.domain LIKE LOWER(CONCAT("%", ${search}, "%"))`
    }

    let domainQueries
    if (isSuperAdmin) {
      domainQueries = aql`
      WITH affiliations, dmarcSummaries, domains, domainsToDmarcSummaries, organizations, ownership, users, domainSearch
      LET userDomains = UNIQUE(FLATTEN(
        LET ids = []
        LET orgIds = (FOR org IN organizations RETURN org._id)
        FOR orgId IN orgIds
          LET claimUserDomains = (FOR v, e IN 1..1 OUTBOUND orgId ownership RETURN v)
          RETURN APPEND(ids, claimUserDomains)
      ))
    `
    } else if (isAffiliated) {
      domainQueries = aql`
      WITH affiliations, dmarcSummaries, domains, domainsToDmarcSummaries, organizations, ownership, users, domainSearch
      LET userAffiliations = (
        FOR v, e IN 1..1 ANY ${userDBId} affiliations
          FILTER e.permission != "pending"
          RETURN v
      )
      LET userDomains = UNIQUE(
        FOR org IN organizations
          FILTER org._key IN userAffiliations[*]._key
          FOR v, e IN 1..1 OUTBOUND org._id ownership
            RETURN v
      )
    `
    } else {
      domainQueries = aql`
      WITH affiliations, dmarcSummaries, domains, domainsToDmarcSummaries, organizations, ownership, users, domainSearch
      LET userAffiliations = (
        FOR v, e IN 1..1 ANY ${userDBId} affiliations
          FILTER e.permission != "pending"
          RETURN v
      )
      LET hasVerifiedOrgAffiliation = POSITION(userAffiliations[*].verified, true)
      LET userDomains = UNIQUE(
        FOR org IN organizations
          FILTER org._key IN userAffiliations[*]._key || (hasVerifiedOrgAffiliation == true && org.verified == true)
          FOR v, e IN 1..1 OUTBOUND org._id ownership
            RETURN v
      )
    `
    }

    let requestedSummaryInfo
    try {
      requestedSummaryInfo = await query`
    ${domainQueries}

    ${afterVar}
    ${beforeVar}

    LET summaryIds = (
      FOR userDomain IN userDomains
        ${searchDomainFilter}
        FOR v, e IN 1..1 ANY userDomain._id domainsToDmarcSummaries
          FILTER e.startDate == ${startDate}
          RETURN e._to
    )

    LET retrievedSummaries = (
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
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
        LET domain = FIRST(
          FOR v, e IN 1..1 ANY summary._id domainsToDmarcSummaries
            RETURN v
        )
        ${hasNextPageFilter}
        SORT ${sortByField} TO_NUMBER(summary._key) ${sortString} LIMIT 1
        RETURN summary
    ) > 0 ? true : false)

    LET hasPreviousPage = (LENGTH(
      FOR summary IN dmarcSummaries
        FILTER summary._id IN summaryIds
        LET domain = FIRST(
          FOR v, e IN 1..1 ANY summary._id domainsToDmarcSummaries
            RETURN v
        )
        ${hasPreviousPageFilter}
        SORT ${sortByField} TO_NUMBER(summary._key) ${sortString} LIMIT 1
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
        `Database error occurred while user: ${userKey} was trying to gather dmarc summaries in loadDmarcSummaryConnectionsByUserId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load DMARC summary data. Please try again.`))
    }

    let summariesInfo
    try {
      summariesInfo = await requestedSummaryInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather dmarc summaries in loadDmarcSummaryConnectionsByUserId, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load DMARC summary data. Please try again.`))
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
        cursor: toGlobalId('dmarcSummary', summary.id),
        node: summary,
      }
    })

    return {
      edges,
      totalCount: summariesInfo.totalCount,
      pageInfo: {
        hasNextPage: summariesInfo.hasNextPage,
        hasPreviousPage: summariesInfo.hasPreviousPage,
        startCursor: toGlobalId('dmarcSummary', summariesInfo.startKey),
        endCursor: toGlobalId('dmarcSummary', summariesInfo.endKey),
      },
    }
  }
