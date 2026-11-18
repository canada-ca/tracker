import { aql } from 'arangojs'
import { t } from '@lingui/macro'

const DEFAULT_ORDER = { field: 'lastSeen', direction: 'DESC' }

const CONFIDENCE_RANK = aql`(
  finding.confidence == 'confirmed' ? 3
  : finding.confidence == 'probable' ? 2
  : finding.confidence == 'suspected' ? 1
  : 0
)`

const sortValueExpressions = {
  lastSeen: aql`finding.lastSeen`,
  firstSeen: aql`finding.firstSeen`,
  occurrenceCount: aql`finding.occurrenceCount`,
  subject: aql`finding.subject`,
  confidence: CONFIDENCE_RANK,
}

const encodeCursor = ({ sortValue, key }) => Buffer.from(JSON.stringify([sortValue, key]), 'utf8').toString('base64')

const decodeCursor = (cursor) => {
  const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf8'))
  if (!Array.isArray(decoded) || decoded.length !== 2 || typeof decoded[1] !== 'string') {
    throw new Error('Malformed cursor')
  }
  return { sortValue: decoded[0], key: decoded[1] }
}

const reverseDirection = (direction) => (direction === 'ASC' ? 'DESC' : 'ASC')

/** AQL filter selecting findings that come strictly after the cursor when sorted in `direction`. */
const pastCursorFilter = ({ cursor, direction }) => {
  const operator = direction === 'ASC' ? aql`>` : aql`<`
  return aql`FILTER sortValue ${operator} ${cursor.sortValue}
    OR (sortValue == ${cursor.sortValue} AND finding._key ${operator} ${cursor.key})`
}

export const loadAdditionalFindingsConnectionsByDomainId =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ domainId, orderBy, limit, first, last, after, before }) => {
    if (domainId === undefined) {
      console.warn(
        `User: ${userKey} did not set \`domainId\` argument for: loadAdditionalFindingsConnectionsByDomainId.`,
      )
      throw new Error(i18n._(t`You must provide a \`domainId\` to retrieve a domain's additional findings.`))
    }

    if (first !== undefined && last !== undefined) {
      console.warn(`User: ${userKey} set both \`first\` and \`last\` for: loadAdditionalFindingsConnectionsByDomainId.`)
      throw new Error(
        i18n._(
          t`Passing both \`first\` and \`last\` to paginate the \`AdditionalFinding\` connection is not supported.`,
        ),
      )
    }

    const pageSize = first ?? last ?? limit
    if (pageSize === undefined) {
      console.warn(`User: ${userKey} did not set a page size for: loadAdditionalFindingsConnectionsByDomainId.`)
      throw new Error(
        i18n._(
          t`You must provide a \`first\`, \`last\` or \`limit\` value to properly paginate the \`AdditionalFinding\` connection.`,
        ),
      )
    }

    if (pageSize <= 0 || pageSize > 100) {
      console.warn(
        `User: ${userKey} set page size outside accepted range: loadAdditionalFindingsConnectionsByDomainId.`,
      )
      throw new Error(
        i18n._(
          t`You must provide a \`first\`, \`last\` or \`limit\` value in the range of 1-100 to properly paginate the \`AdditionalFinding\` connection.`,
        ),
      )
    }

    if (after && before) {
      console.warn(`User: ${userKey} set multiple pagination methods for: loadAdditionalFindingsConnectionsByDomainId.`)
      throw new Error(
        i18n._(
          t`You must provide at most one pagination method (\`before\`, \`after\`) value to properly paginate the \`AdditionalFinding\` connection.`,
        ),
      )
    }

    const rawCursor = cleanseInput(after || before)
    let cursor
    if (rawCursor) {
      try {
        cursor = decodeCursor(rawCursor)
      } catch (err) {
        console.warn(
          `User: ${userKey} supplied an invalid cursor for: loadAdditionalFindingsConnectionsByDomainId. Error: ${err}`,
        )
        throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
      }
    }

    const { field, direction } = orderBy ?? DEFAULT_ORDER
    const sortValueExpression = sortValueExpressions[field]
    const pageDirection = before ? reverseDirection(direction) : direction

    const sortDirection = pageDirection === 'ASC' ? aql`ASC` : aql`DESC`

    const matchingFindings = aql`
      FOR finding IN additionalFindings
        FILTER finding.domain == ${domainId}
        FILTER finding.status == 'active'
        LET sortValue = ${sortValueExpression}
    `
    const pageFilter = cursor ? pastCursorFilter({ cursor, direction: pageDirection }) : aql``
    const reversePageFilter = cursor ? pastCursorFilter({ cursor, direction: reverseDirection(pageDirection) }) : null

    const findingsQuery = aql`
      WITH additionalFindings, domains
      LET findingsPlusOne = (
        ${matchingFindings}
        ${pageFilter}
        SORT sortValue ${sortDirection}, finding._key ${sortDirection}
        LIMIT ${pageSize + 1}
        RETURN MERGE({ id: finding._key, _type: "additionalFinding", sortValue: sortValue }, finding)
      )
      LET hasMorePage = LENGTH(findingsPlusOne) == ${pageSize} + 1
      LET hasReversePage = ${reversePageFilter === null} ? false : LENGTH(
        ${matchingFindings}
        ${reversePageFilter ?? aql``}
        LIMIT 1
        RETURN true
      ) > 0
      LET totalCount = COUNT(
        ${matchingFindings}
        RETURN true
      )

      RETURN {
        "findings": SLICE(findingsPlusOne, 0, ${pageSize}),
        "hasMorePage": hasMorePage,
        "hasReversePage": hasReversePage,
        "totalCount": totalCount
      }
    `

    let findingsCursor
    try {
      findingsCursor = await query`${findingsQuery}`
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get additional findings for domain '${domainId}' with cursor '${
          after || before
        }', error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
    }

    let findingsInfo
    try {
      findingsInfo = await findingsCursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get additional findings for domain '${domainId}', error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional findings. Please try again.`))
    }

    // `before` pages are fetched in reverse sort order; restore display order.
    const findings = before ? findingsInfo.findings.reverse() : findingsInfo.findings

    const edges = findings.map((finding) => ({
      cursor: encodeCursor({ sortValue: finding.sortValue, key: finding._key }),
      node: finding,
    }))

    const hasMoreInDirection = findingsInfo.hasMorePage
    const hasMoreOppositeDirection = findingsInfo.hasReversePage

    return {
      edges,
      totalCount: findingsInfo.totalCount,
      pageInfo: {
        hasNextPage: before ? hasMoreOppositeDirection : hasMoreInDirection,
        hasPreviousPage: before ? hasMoreInDirection : hasMoreOppositeDirection,
        startCursor: edges.length > 0 ? edges[0].cursor : null,
        endCursor: edges.length > 0 ? edges.at(-1).cursor : null,
      },
    }
  }
