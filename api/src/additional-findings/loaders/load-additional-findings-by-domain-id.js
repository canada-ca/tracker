import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadAdditionalFindingsByDomainId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ domainId, limit, after, before, orderBy, filters = [] }) => {
    if (domainId === undefined) {
      console.warn(`User: ${userKey} did not set \`domainId\` argument for: loadAdditionalFindingsByDomainId.`)
      throw new Error(i18n._(t`You must provide a \`domainId\` to retrieve a domain's additional findings.`))
    }

    if (limit === undefined) {
      console.warn(`User: ${userKey} did not set \`limit\` argument for: loadAdditionalFindingsByDomainId.`)
      throw new Error(i18n._(t`You must provide a \`limit\` value to properly paginate additional findings.`))
    }

    if (limit <= 0 || limit > 100) {
      console.warn(`User: ${userKey} set \`limit\` argument outside accepted range: loadAdditionalFindingsByDomainId.`)
      throw new Error(
        i18n._(t`You must provide a \`limit\` value in the range of 1-100 to properly paginate additional findings.`),
      )
    }

    before = cleanseInput(before)
    after = cleanseInput(after)

    const usingRelayExplicitly = !!(before || after)

    const resolveCursor = (cursor) => {
      const cursorString = Buffer.from(cursor, 'base64').toString('utf8').split('|')

      return cursorString.reduce((acc, currentValue) => {
        const [type, id] = currentValue.split('::')
        acc.push({ type, id })
        return acc
      }, [])
    }

    const buildComparison = (comparison) => {
      return comparison === '==' ? aql`==` : aql`!=`
    }

    const buildSingleFilter = (accumulated, { filterCategory, comparison, filterValue }) => {
      const cmp = buildComparison(comparison)

      switch (filterCategory) {
        case 'source':
          return aql`${accumulated} FILTER finding.source ${cmp} ${filterValue}`
        case 'findingType':
          return aql`${accumulated} FILTER finding.findingType ${cmp} ${filterValue}`
        case 'subject':
          return aql`${accumulated} FILTER finding.subject ${cmp} ${filterValue}`
        case 'confidence':
          return aql`${accumulated} FILTER finding.confidence ${cmp} ${filterValue}`
        case 'severity':
          return aql`${accumulated} FILTER finding.severity ${cmp} ${filterValue}`
        case 'status':
          return aql`${accumulated} FILTER finding.status ${cmp} ${filterValue}`
        default:
          return accumulated
      }
    }

    const findingFilters = filters.reduce(buildSingleFilter, aql``)

    let relayBeforeTemplate = aql``
    let relayAfterTemplate = aql``
    if (usingRelayExplicitly) {
      const cursorList = resolveCursor(after || before)

      const orderByDirectionArrow =
        orderBy?.direction === 'DESC' ? aql`<` : orderBy?.direction === 'ASC' ? aql`>` : null
      const reverseOrderByDirectionArrow =
        orderBy?.direction === 'DESC' ? aql`>` : orderBy?.direction === 'ASC' ? aql`<` : null

      relayBeforeTemplate = aql`FILTER TO_NUMBER(finding._key) < TO_NUMBER(${cursorList[0].id})`
      relayAfterTemplate = aql`FILTER TO_NUMBER(finding._key) > TO_NUMBER(${cursorList[0].id})`

      if (cursorList.length === 2) {
        relayAfterTemplate = aql`
          FILTER finding.${cursorList[0].type} ${orderByDirectionArrow || aql`>`} ${cursorList[0].id}
          OR (finding.${cursorList[0].type} == ${cursorList[0].id}
          AND TO_NUMBER(finding._key) > TO_NUMBER(${cursorList[1].id}))
        `

        relayBeforeTemplate = aql`
          FILTER finding.${cursorList[0].type} ${reverseOrderByDirectionArrow || aql`<`} ${cursorList[0].id}
          OR (finding.${cursorList[0].type} == ${cursorList[0].id}
          AND TO_NUMBER(finding._key) < TO_NUMBER(${cursorList[1].id}))
        `
      }
    }

    const relayDirectionString = before ? aql`DESC` : aql`ASC`

    let sortTemplate
    if (!orderBy) {
      sortTemplate = aql`SORT TO_NUMBER(finding._key) ${relayDirectionString}`
    } else {
      sortTemplate = aql`
        SORT finding.${orderBy.field} ${orderBy.direction}, TO_NUMBER(finding._key) ${relayDirectionString}
      `
    }

    const removeExtraSliceTemplate = aql`SLICE(findingsPlusOne, 0, ${limit})`
    const findingsQuery = aql`
      WITH additionalFindings
      LET findingsPlusOne = (
        FOR finding IN additionalFindings
          FILTER finding.domainKey == ${domainId}
          ${findingFilters}
          ${before ? relayBeforeTemplate : relayAfterTemplate}
          ${sortTemplate}
          LIMIT ${limit + 1}
          RETURN MERGE({ id: finding._key, _type: "additionalFinding" }, finding)
      )
      LET hasMoreRelayPage = LENGTH(findingsPlusOne) == ${limit} + 1
      LET hasReversePage = ${!usingRelayExplicitly} ? false : (LENGTH(
          FOR finding IN additionalFindings
            FILTER finding.domainKey == ${domainId}
            ${findingFilters}
            ${before ? relayAfterTemplate : relayBeforeTemplate}
            LIMIT 1
            RETURN true
      ) > 0) ? true : false
      LET totalCount = COUNT(
          FOR finding IN additionalFindings
            FILTER finding.domainKey == ${domainId}
            ${findingFilters}
            RETURN true
      )
      LET findings = ${removeExtraSliceTemplate}

      RETURN {
        "findings": findings,
        "hasMoreRelayPage": hasMoreRelayPage,
        "hasReversePage": hasReversePage,
        "totalCount": totalCount
      }
    `

    let findingsCursor
    try {
      findingsCursor = await query`${findingsQuery}`
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather additional findings for domain: ${domainId}. Error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
    }

    let findingsInfo
    try {
      findingsInfo = await findingsCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather additional findings for domain: ${domainId}. Error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
    }

    const findings = findingsInfo.findings

    if (findings.length === 0) {
      return {
        edges: [],
        totalCount: findingsInfo.totalCount,
        pageInfo: {
          hasPreviousPage: !usingRelayExplicitly
            ? false
            : after
              ? findingsInfo.hasReversePage
              : findingsInfo.hasMoreRelayPage,
          hasNextPage: after || !usingRelayExplicitly ? findingsInfo.hasMoreRelayPage : findingsInfo.hasReversePage,
          startCursor: null,
          endCursor: null,
        },
      }
    }

    const toCursorString = (cursorObjects) => {
      const cursorStringArray = cursorObjects.reduce((acc, cursorObject) => {
        acc.push(`${cursorObject.type}::${cursorObject.id}`)
        return acc
      }, [])
      const cursorString = cursorStringArray.join('|')
      return Buffer.from(cursorString, 'utf8').toString('base64')
    }

    const edges = findings.map((finding) => {
      let cursor
      if (orderBy) {
        cursor = toCursorString([
          {
            type: orderBy.field,
            id: finding[orderBy.field],
          },
          {
            type: 'id',
            id: finding._key,
          },
        ])
      } else {
        cursor = toCursorString([
          {
            type: 'id',
            id: finding._key,
          },
        ])
      }

      return {
        cursor,
        node: finding,
      }
    })

    return {
      edges,
      totalCount: findingsInfo.totalCount,
      pageInfo: {
        hasPreviousPage: !usingRelayExplicitly
          ? false
          : after
            ? findingsInfo.hasReversePage
            : findingsInfo.hasMoreRelayPage,
        hasNextPage: after || !usingRelayExplicitly ? findingsInfo.hasMoreRelayPage : findingsInfo.hasReversePage,
        endCursor: edges.length > 0 ? edges.at(-1).cursor : null,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
      },
    }
  }
