import { aql } from 'arangojs'
import { fromGlobalId, toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadDnsConnectionsByDomainId =
  ({ query, db, userKey, cleanseInput, i18n }) =>
  async ({
    limit,
    domainId,
    startDate,
    endDate,
    after,
    before,
    offset,
    orderBy
  }) => {
    if (limit === undefined) {
      console.warn(
        `User: ${userKey} did not set \`limit\` argument for: loadDnsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`limit\` value to properly paginate the \`DNS\` connection.`,
        ),
      )
    }

    if (limit <= 0 || limit > 100) {
      console.warn(
        `User: ${userKey} set \`limit\` argument outside accepted range: loadDnsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`limit\` value in the range of 1-100 to properly paginate the \`DNS\` connection.`,
        ),
      )
    }

    let paginationMethodCount = [before, after, offset].reduce(
      (paginationMethod, currentValue) => currentValue + (paginationMethod === undefined),
      0
    )

    if (paginationMethodCount > 1) {
      console.warn(
        `User: ${userKey} set multiple pagination methods for: loadDnsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide at most one pagination method (\`before\`, \`after\`, \`offset\`) value to properly paginate the \`DNS\` connection.`,
        ),
      )
    }

    const usingRelayExplicitly = !!(before || after)

    const resolveCursor = (cursor) => {
      const cursorString = Buffer.from(cursor, 'base64')
        .toString("utf8")
        .split("|")

      return cursorString.reduce(
        (acc, currentValue) => {
          const [key, id] = currentValue.split(':')
          acc.push({[key]: id})
          return acc
        },
        [])
    }

    let relayBeforeTemplate = aql``
    let relayAfterTemplate = aql``
    if (usingRelayExplicitly) {
      const cursorList = resolveCursor(after || before)
      if (cursorList.length === 0 || cursorList > 2) {
        // TODO: throw error
      }

      if (cursorList.at(-1).type !== "id") {
        // id field should always be last property
        // TODO: throw error
      }

      const orderByDirectionArrow = orderBy?.direction === "DESC" ? aql`<` : orderBy?.direction === "ASC" ? aql`>` : null

      relayBeforeTemplate = aql`FILTER TO_NUMBER(dnsScan._key) < TO_NUMBER(${cursorList[0].id})`
      relayAfterTemplate = aql`FILTER TO_NUMBER(dnsScan._key) > TO_NUMBER(${cursorList[0].id})`
      if (cursorList.length === 2) {
        relayAfterTemplate = aql`
        FILTER dnsScan.${cursorList[0].type} ${orderByDirectionArrow || aql`>`} ${cursorList[0].id}
        OR (dnsScan.${cursorList[0].type} == ${cursorList[0].id}
        AND TO_NUMBER(dnsScan._key) > TO_NUMBER(${cursorList[1].id}))
      `

        relayBeforeTemplate = aql`
        FILTER dnsScan.${cursorList[0].type} ${orderByDirectionArrow || aql`<`} ${cursorList[0].id}
        OR (dnsScan.${cursorList[0].type} == ${cursorList[0].id}
        AND TO_NUMBER(dnsScan._key) < TO_NUMBER(${cursorList[1].id}))
      `
      }
    }

    const relayDirectionString = before ? aql`DESC` : aql`ASC`

    let sortTemplate
    if (!orderBy) {
      sortTemplate = aql`SORT TO_NUMBER(dnsScan._key) ${relayDirectionString}`
    }
    else {
      sortTemplate = aql`SORT dnsScan.${orderBy.field} ${orderBy.direction}, TO_NUMBER(dnsScan._key) ${relayDirectionString}`
    }

    let startDateFilter = aql``
    if (typeof startDate !== 'undefined') {
      startDateFilter = aql`
      FILTER DATE_FORMAT(dnsScan.timestamp, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')`
    }

    let endDateFilter = aql``
    if (typeof endDate !== 'undefined') {
      endDateFilter = aql`
      FILTER DATE_FORMAT(dnsScan.timestamp, '%yyyy-%mm-%dd') <= DATE_FORMAT(${endDate}, '%yyyy-%mm-%dd')`
    }

    const dnsScanQuery = aql`
      FOR dnsScan, e IN 1 OUTBOUND ${domainId} domainsDNS
        ${startDateFilter}
        ${endDateFilter}
        ${before ? relayBeforeTemplate : relayAfterTemplate}
        ${sortTemplate}
        LIMIT ${limit + 1}
        RETURN MERGE({ id: dnsScan._key, _type: "dnsScan" }, dnsScan)
    `

    let dnsScanCursor
    try {
      dnsScanCursor = await db.query(dnsScanQuery, { fullCount: true })
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get cursor for DNS document '${after || before}' for domain '${domainId}', error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DNS scan(s). Please try again.`),
      )
    }

    const fullCount = dnsScanCursor.extra.stats.fullCount

    let dnsScansPlusOne
    try {
      dnsScansPlusOne = await dnsScanCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get DNS information for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DNS scan(s). Please try again.`),
      )
    }

    let reverseRelayPageExistsCursor
    try {
      reverseRelayPageExistsCursor = await db.query(aql`
      RETURN LENGTH(
        FOR dnsScan, e IN 1 OUTBOUND ${domainId} domainsDNS
          ${startDateFilter}
          ${endDateFilter}
          ${before ? relayAfterTemplate : relayBeforeTemplate}
          LIMIT 1
          RETURN true
      ) > 0
    `)
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get DNS reverse relay page exists cursor for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DNS scan(s). Please try again.`),
      )
    }


    let reverseRelayPageExists
    try {
      reverseRelayPageExists = await reverseRelayPageExistsCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get DNS reverse relay page for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DNS scan(s). Please try again.`),
      )
    }

    if (dnsScansPlusOne.length === 0) {
      return {
        edges: [],
        totalCount: fullCount,
        pageInfo: {
          hasNextPage: (after || !usingRelayExplicitly) ? false : reverseRelayPageExists,
          hasPreviousPage: after ? reverseRelayPageExists : false,
          startCursor: null,
          endCursor: null,
        },
      }
    }

    const moreRelayPageExists = dnsScansPlusOne.length === (limit + 1)
    if (before) {
      dnsScansPlusOne.reverse()
    }

    const dnsScans = moreRelayPageExists ? dnsScansPlusOne.slice(0, -1) : dnsScansPlusOne

    const toCursorString = (cursorObjects) => {
      const cursorStringArray = cursorObjects.reduce(
        (acc, cursorObject) => {
          if (cursorObject.type === undefined || cursorObject.id === undefined) {
            // TODO: throw error
          }
          acc.push(`${cursorObject.type}:${cursorObject.id}`)
          return acc
        }, [])
      const cursorString = cursorStringArray.join('|')
      return Buffer.from(cursorString, 'utf8').toString('base64')
    }

    const edges = dnsScans.map((dnsScan) => {
      let cursor
      if (orderBy) {
        cursor = toCursorString([
          {
            type: orderBy.field,
            id: dnsScan[orderBy.field]
          },
          {
            type: "id",
            id: dnsScan._key
          }]
        )
      } else {
        cursor = toCursorString([{
          type: "id",
          id: dnsScan._key
        }])
      }
      return {
        cursor: cursor,
        node: dnsScan,
      }
    })

    return {
      edges: edges,
      totalCount: fullCount,
      pageInfo: {
        hasPreviousPage: !usingRelayExplicitly ? false : after ? reverseRelayPageExists : moreRelayPageExists,
        hasNextPage: (after || !usingRelayExplicitly) ? moreRelayPageExists : reverseRelayPageExists,
        endCursor: edges.length > 0 ? edges.at(-1).cursor : null,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
      },
    }
  }
