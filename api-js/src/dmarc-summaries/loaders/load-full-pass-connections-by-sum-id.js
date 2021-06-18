import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadFullPassConnectionsBySumId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ after, before, first, last, summaryId }) => {
    if (typeof summaryId === 'undefined') {
      console.warn(
        `SummaryId was undefined when user: ${userKey} attempted to load full passes in loadFullPassConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(t`Unable to load full pass data. Please try again.`),
      )
    }

    let afterTemplate = aql``
    if (typeof after !== 'undefined') {
      const { id } = fromGlobalId(cleanseInput(after))
      afterTemplate = aql`FILTER TO_NUMBER(fullPass.id) > TO_NUMBER(${id})`
    }

    let beforeTemplate = aql``
    if (typeof before !== 'undefined') {
      const { id } = fromGlobalId(cleanseInput(before))
      beforeTemplate = aql`FILTER TO_NUMBER(fullPass.id) < TO_NUMBER(${id})`
    }

    let limitTemplate = aql``
    if (typeof first === 'undefined' && typeof last === 'undefined') {
      console.warn(
        `User: ${userKey} did not have either \`first\` or \`last\` arguments set for: loadFullPassConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\` or \`last\` value to properly paginate the \`FullPassTable\` connection.`,
        ),
      )
    } else if (typeof first !== 'undefined' && typeof last !== 'undefined') {
      console.warn(
        `User: ${userKey} attempted to have \`first\` and \`last\` arguments set for: loadFullPassConnectionsBySumId.`,
      )
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`FullPassTable\` connection is not supported.`,
        ),
      )
    } else if (typeof first === 'number' || typeof last === 'number') {
      /* istanbul ignore else */
      if (first < 0 || last < 0) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set below zero for: loadFullPassConnectionsBySumId.`,
        )
        throw new Error(
          i18n._(
            t`\`${argSet}\` on the \`FullPassTable\` connection cannot be less than zero.`,
          ),
        )
      } else if (first > 100 || last > 100) {
        const argSet = typeof first !== 'undefined' ? 'first' : 'last'
        const amount = typeof first !== 'undefined' ? first : last
        console.warn(
          `User: ${userKey} attempted to have \`${argSet}\` set to ${amount} for: loadFullPassConnectionsBySumId.`,
        )
        throw new Error(
          i18n._(
            t`Requesting \`${amount}\` records on the \`FullPassTable\` connection exceeds the \`${argSet}\` limit of 100 records.`,
          ),
        )
      } else if (typeof first !== 'undefined' && typeof last === 'undefined') {
        limitTemplate = aql`SORT fullPass.id ASC LIMIT TO_NUMBER(${first})`
      } else if (typeof first === 'undefined' && typeof last !== 'undefined') {
        limitTemplate = aql`SORT fullPass.id DESC LIMIT TO_NUMBER(${last})`
      }
    } else {
      const argSet = typeof first !== 'undefined' ? 'first' : 'last'
      const typeSet = typeof first !== 'undefined' ? typeof first : typeof last
      console.warn(
        `User: ${userKey} attempted to have \`${argSet}\` set as a ${typeSet} for: loadFullPassConnectionsBySumId.`,
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

    let requestedFullPassInfo
    try {
      requestedFullPassInfo = await query`
      WITH dmarcSummaries
      LET fullPasses = FLATTEN(
        FOR summary IN dmarcSummaries
          FILTER summary._id == ${summaryId}
          RETURN summary.detailTables.fullPass
      )

      LET retrievedFullPass = (
        FOR fullPass IN fullPasses
          ${afterTemplate}
          ${beforeTemplate}
          ${limitTemplate}
          RETURN MERGE({ type: 'fullPass' }, fullPass)
      )

      LET hasNextPage = (LENGTH(
        FOR fullPass IN fullPasses
          FILTER TO_NUMBER(fullPass.id) > TO_NUMBER(LAST(retrievedFullPass).id)
          SORT fullPass.id ${sortString} LIMIT 1
          RETURN fullPass
      ) > 0 ? true : false)

      LET hasPreviousPage = (LENGTH(
        FOR fullPass IN fullPasses
          FILTER TO_NUMBER(fullPass.id) < TO_NUMBER(FIRST(retrievedFullPass).id)
          SORT fullPass.id ${sortString} LIMIT 1
          RETURN fullPass
      ) > 0 ? true : false)

      RETURN {
        "fullPasses": retrievedFullPass,
        "totalCount": LENGTH(fullPasses),
        "hasNextPage": hasNextPage,
        "hasPreviousPage": hasPreviousPage,
        "startKey": FIRST(retrievedFullPass).id,
        "endKey": LAST(retrievedFullPass).id
      }
    `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather full passes in loadFullPassConnectionsBySumId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load full pass data. Please try again.`),
      )
    }

    let fullPassInfo
    try {
      fullPassInfo = await requestedFullPassInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather full passes in loadFullPassConnectionsBySumId, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load full pass data. Please try again.`),
      )
    }

    if (fullPassInfo.fullPasses.length === 0) {
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

    const edges = fullPassInfo.fullPasses.map((fullPass) => ({
      cursor: toGlobalId('fullPass', fullPass.id),
      node: fullPass,
    }))

    return {
      edges,
      totalCount: fullPassInfo.totalCount,
      pageInfo: {
        hasNextPage: fullPassInfo.hasNextPage,
        hasPreviousPage: fullPassInfo.hasPreviousPage,
        startCursor: toGlobalId('fullPass', fullPassInfo.startKey),
        endCursor: toGlobalId('fullPass', fullPassInfo.endKey),
      },
    }
  }
