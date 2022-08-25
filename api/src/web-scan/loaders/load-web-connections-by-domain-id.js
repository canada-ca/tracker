import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadWebConnectionsByDomainId =
  ({ query, userKey, cleanseInput, i18n }) =>
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
        `User: ${userKey} did not set \`limit\` argument for: loadWebConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`limit\` value to properly paginate the \`web\` connection.`,
        ),
      )
    }

    if (limit <= 0 || limit > 100) {
      console.warn(
        `User: ${userKey} set \`limit\` argument outside accepted range: loadWebConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`limit\` value in the range of 1-100 to properly paginate the \`web\` connection.`,
        ),
      )
    }

    let paginationMethodCount = [before, after, offset].reduce(
      (paginationMethod, currentValue) => currentValue + (paginationMethod === undefined),
      0
    )

    if (paginationMethodCount > 1) {
      console.warn(
        `User: ${userKey} set multiple pagination methods for: loadWebConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide at most one pagination method (\`before\`, \`after\`, \`offset\`) value to properly paginate the \`web\` connection.`,
        ),
      )
    }

    before = cleanseInput(before)
    after = cleanseInput(after)

    const usingRelayExplicitly = !!(before || after)

    const resolveCursor = (cursor) => {
      const cursorString = Buffer.from(cursor, 'base64')
        .toString("utf8")
        .split("|")

      return cursorString.reduce(
        (acc, currentValue) => {
          const [type, id] = currentValue.split('::')
          acc.push({type, id})
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
      const reverseOrderByDirectionArrow = orderBy?.direction === "DESC" ? aql`>` : orderBy?.direction === "ASC" ? aql`<` : null

      relayBeforeTemplate = aql`FILTER TO_NUMBER(webScan._key) < TO_NUMBER(${cursorList[0].id})`
      relayAfterTemplate = aql`FILTER TO_NUMBER(webScan._key) > TO_NUMBER(${cursorList[0].id})`

      if (cursorList.length === 2) {
        relayAfterTemplate = aql`
        FILTER webScan.${cursorList[0].type} ${orderByDirectionArrow || aql`>`} ${cursorList[0].id}
        OR (webScan.${cursorList[0].type} == ${cursorList[0].id}
        AND TO_NUMBER(webScan._key) > TO_NUMBER(${cursorList[1].id}))
      `

        relayBeforeTemplate = aql`
        FILTER webScan.${cursorList[0].type} ${reverseOrderByDirectionArrow || aql`<`} ${cursorList[0].id}
        OR (webScan.${cursorList[0].type} == ${cursorList[0].id}
        AND TO_NUMBER(webScan._key) < TO_NUMBER(${cursorList[1].id}))
      `
      }
    }

    const relayDirectionString = before ? aql`DESC` : aql`ASC`

    let sortTemplate
    if (!orderBy) {
      sortTemplate = aql`SORT TO_NUMBER(webScan._key) ${relayDirectionString}`
    }
    else {
      sortTemplate = aql`SORT webScan.${orderBy.field} ${orderBy.direction}, TO_NUMBER(webScan._key) ${relayDirectionString}`
    }

    let startDateFilter = aql``
    if (typeof startDate !== 'undefined') {
      startDateFilter = aql`
      FILTER DATE_FORMAT(webScan.timestamp, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')`
    }

    let endDateFilter = aql``
    if (typeof endDate !== 'undefined') {
      endDateFilter = aql`
      FILTER DATE_FORMAT(webScan.timestamp, '%yyyy-%mm-%dd') <= DATE_FORMAT(${endDate}, '%yyyy-%mm-%dd')`
    }

    let removeExtraSliceTemplate = aql`SLICE(webScansPlusOne, 0, ${limit})`
    const webScanQuery = aql`
      LET webScansPlusOne = (
        FOR webScan, e IN 1 OUTBOUND ${domainId} domainsWeb
          ${startDateFilter}
          ${endDateFilter}
          ${before ? relayBeforeTemplate : relayAfterTemplate}
          ${sortTemplate}
          LIMIT ${limit + 1}
          RETURN MERGE({ id: webScan._key, _type: "webScan" }, webScan)
      )
      LET hasMoreRelayPage = LENGTH(webScansPlusOne) == ${limit} + 1
      LET hasReversePage = ${!usingRelayExplicitly} ? false : (LENGTH(
          FOR webScan, e IN 1 OUTBOUND ${domainId} domainsWeb
            ${startDateFilter}
            ${endDateFilter}
            ${before ? relayAfterTemplate : relayBeforeTemplate}
            LIMIT 1
            RETURN true
        ) > 0) ? true : false
      LET totalCount = COUNT(
          FOR webScan, e IN 1 OUTBOUND ${domainId} domainsWeb
            ${startDateFilter}
            ${endDateFilter}
            RETURN true
      )
      LET webScans = ${removeExtraSliceTemplate}

      RETURN {
        "webScans": webScans,
        "hasMoreRelayPage": hasMoreRelayPage,
        "hasReversePage": hasReversePage,
        "totalCount": totalCount
      }
    `

    let webScanCursor
    try {
      webScanCursor = await query`${webScanQuery}`
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get cursor for web document with cursor '${after || before}' for domain '${domainId}', error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load web scan(s). Please try again.`),
      )
    }

    let webScanInfo
    try {
      webScanInfo = await webScanCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get web scan information for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load web scan(s). Please try again.`),
      )
    }

    console.log(webScanInfo)

    const webScans = webScanInfo.webScans

    if (webScans.length === 0) {
      return {
        edges: [],
        totalCount: webScanInfo.totalCount,
        pageInfo: {
          hasPreviousPage: !usingRelayExplicitly ? false : after ? webScanInfo.hasReversePage : webScanInfo.hasMoreRelayPage,
          hasNextPage: (after || !usingRelayExplicitly) ? webScanInfo.hasMoreRelayPage : webScanInfo.hasReversePage,
          startCursor: null,
          endCursor: null,
        },
      }
    }

    const toCursorString = (cursorObjects) => {
      const cursorStringArray = cursorObjects.reduce(
        (acc, cursorObject) => {
          if (cursorObject.type === undefined || cursorObject.id === undefined) {
            // TODO: throw error
          }
          acc.push(`${cursorObject.type}::${cursorObject.id}`)
          return acc
        }, [])
      const cursorString = cursorStringArray.join('|')
      return Buffer.from(cursorString, 'utf8').toString('base64')
    }

    const edges = webScans.map((webScan) => {
      let cursor
      if (orderBy) {
        cursor = toCursorString([
          {
            type: orderBy.field,
            id: webScan[orderBy.field]
          },
          {
            type: "id",
            id: webScan._key
          }]
        )
      } else {
        cursor = toCursorString([{
          type: "id",
          id: webScan._key
        }])
      }
      return {
        cursor: cursor,
        node: webScan,
      }
    })

    return {
      edges: edges,
      totalCount: webScanInfo.totalCount,
      pageInfo: {
        hasPreviousPage: !usingRelayExplicitly ? false : after ? webScanInfo.hasReversePage : webScanInfo.hasMoreRelayPage,
        hasNextPage: (after || !usingRelayExplicitly) ? webScanInfo.hasMoreRelayPage : webScanInfo.hasReversePage,
        endCursor: edges.length > 0 ? edges.at(-1).cursor : null,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
      },
    }
  }
