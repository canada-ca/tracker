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

      relayBeforeTemplate = aql`FILTER TO_NUMBER(web._key) < TO_NUMBER(${cursorList[0].id})`
      relayAfterTemplate = aql`FILTER TO_NUMBER(web._key) > TO_NUMBER(${cursorList[0].id})`

      if (cursorList.length === 2) {
        relayAfterTemplate = aql`
        FILTER web.${cursorList[0].type} ${orderByDirectionArrow || aql`>`} ${cursorList[0].id}
        OR (web.${cursorList[0].type} == ${cursorList[0].id}
        AND TO_NUMBER(web._key) > TO_NUMBER(${cursorList[1].id}))
      `

        relayBeforeTemplate = aql`
        FILTER web.${cursorList[0].type} ${reverseOrderByDirectionArrow || aql`<`} ${cursorList[0].id}
        OR (web.${cursorList[0].type} == ${cursorList[0].id}
        AND TO_NUMBER(web._key) < TO_NUMBER(${cursorList[1].id}))
      `
      }
    }

    const relayDirectionString = before ? aql`DESC` : aql`ASC`

    let sortTemplate
    if (!orderBy) {
      sortTemplate = aql`SORT TO_NUMBER(web._key) ${relayDirectionString}`
    }
    else {
      sortTemplate = aql`SORT web.${orderBy.field} ${orderBy.direction}, TO_NUMBER(web._key) ${relayDirectionString}`
    }

    let startDateFilter = aql``
    if (typeof startDate !== 'undefined') {
      startDateFilter = aql`
      FILTER DATE_FORMAT(web.timestamp, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')`
    }

    let endDateFilter = aql``
    if (typeof endDate !== 'undefined') {
      endDateFilter = aql`
      FILTER DATE_FORMAT(web.timestamp, '%yyyy-%mm-%dd') <= DATE_FORMAT(${endDate}, '%yyyy-%mm-%dd')`
    }

    let removeExtraSliceTemplate = aql`SLICE(websPlusOne, 0, ${limit})`
    const webQuery = aql`
      LET websPlusOne = (
        FOR web, e IN 1 OUTBOUND ${domainId} domainsWeb
          ${startDateFilter}
          ${endDateFilter}
          ${before ? relayBeforeTemplate : relayAfterTemplate}
          ${sortTemplate}
          LIMIT ${limit + 1}
          RETURN MERGE({ id: web._key, _type: "web" }, web)
      )
      LET hasMoreRelayPage = LENGTH(websPlusOne) == ${limit} + 1
      LET hasReversePage = ${!usingRelayExplicitly} ? false : (LENGTH(
          FOR web, e IN 1 OUTBOUND ${domainId} domainsWeb
            ${startDateFilter}
            ${endDateFilter}
            ${before ? relayAfterTemplate : relayBeforeTemplate}
            LIMIT 1
            RETURN true
        ) > 0) ? true : false
      LET totalCount = COUNT(
          FOR web, e IN 1 OUTBOUND ${domainId} domainsWeb
            ${startDateFilter}
            ${endDateFilter}
            RETURN true
      )
      LET webs = ${removeExtraSliceTemplate}

      RETURN {
        "webs": webs,
        "hasMoreRelayPage": hasMoreRelayPage,
        "hasReversePage": hasReversePage,
        "totalCount": totalCount
      }
    `

    let webCursor
    try {
      webCursor = await query`${webQuery}`
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get cursor for web document with cursor '${after || before}' for domain '${domainId}', error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load web scan(s). Please try again.`),
      )
    }

    let webInfo
    try {
      webInfo = await webCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get web scan information for ${domainId}, error: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load web scan(s). Please try again.`),
      )
    }

    const webs = webInfo.webs

    if (webs.length === 0) {
      return {
        edges: [],
        totalCount: webInfo.totalCount,
        pageInfo: {
          hasPreviousPage: !usingRelayExplicitly ? false : after ? webInfo.hasReversePage : webInfo.hasMoreRelayPage,
          hasNextPage: (after || !usingRelayExplicitly) ? webInfo.hasMoreRelayPage : webInfo.hasReversePage,
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

    const edges = webs.map((web) => {
      let cursor
      if (orderBy) {
        cursor = toCursorString([
          {
            type: orderBy.field,
            id: web[orderBy.field]
          },
          {
            type: "id",
            id: web._key
          }]
        )
      } else {
        cursor = toCursorString([{
          type: "id",
          id: web._key
        }])
      }
      return {
        cursor: cursor,
        node: web,
      }
    })

    return {
      edges: edges,
      totalCount: webInfo.totalCount,
      pageInfo: {
        hasPreviousPage: !usingRelayExplicitly ? false : after ? webInfo.hasReversePage : webInfo.hasMoreRelayPage,
        hasNextPage: (after || !usingRelayExplicitly) ? webInfo.hasMoreRelayPage : webInfo.hasReversePage,
        endCursor: edges.length > 0 ? edges.at(-1).cursor : null,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
      },
    }
  }
