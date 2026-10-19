import { aql } from 'arangojs'
import { t } from '@lingui/macro'

export const loadAdditionalFindingsByDomainId =
  ({ query, userKey, i18n }) =>
  async ({ domainId, limit, offset = 0, orderBy }) => {
    if (typeof limit !== 'number') {
      console.warn(`User: ${userKey} did not set valid \`limit\` argument for: loadAdditionalFindingsByDomainId. `)
      throw new Error(i18n._(t`Must provide numeric limit value`))
    } else if (limit < 1 || limit > 100) {
      console.warn(
        `User: ${userKey} set \`limit\` argument outside accepted range for: loadAdditionalFindingsByDomainId. `,
      )
      throw new Error(i18n._(t`Limit must be between 1 and 100`))
    }

    if (typeof offset !== 'number') {
      console.warn(`User: ${userKey} did not set valid \`offset\` argument for: loadAdditionalFindingsByDomainId. `)
      throw new Error(i18n._(t`Must provide numeric offset value`))
    } else if (offset < 0 || offset > 100) {
      console.warn(
        `User: ${userKey} set \`offset\` argument outside accepted range for: loadAdditionalFindingsByDomainId. `,
      )
      throw new Error(i18n._(t`Offset must be between 0 and 100`))
    }

    let sortByField = aql``
    let rankField = aql``
    if (typeof orderBy !== 'undefined') {
      switch (orderBy.field) {
        case 'confidence':
          rankField = aql`
            LET confidenceRank = POSITION(["suspected", "probable", "confirmed"], finding.confidence, true)
          `
          sortByField = aql`confidenceRank`
          break
        case 'severity':
          rankField = aql`
            LET severityRank = POSITION(["info", "low", "medium", "high", "critical"], finding.severity, true)
          `
          sortByField = aql`severityRank`
          break
        default:
          sortByField = aql`finding.${orderBy.field}`
      }
    } else {
      sortByField = aql`TO_NUMBER(finding._key)`
    }

    let sortByDirection = aql`ASC`
    if (orderBy.direction === 'DESC') {
      sortByDirection = aql`DESC`
    }

    const additionalFindingQuery = aql`
    WITH additionalFindings
    LET domainFindings = (
      FOR finding IN additionalFindings
        FILTER finding.domainKey == ${domainId}
        RETURN finding
      )
    LET totalCount = COUNT(domainFindings)
    LET sortedFindings = (
      FOR finding IN domainFindings
        ${rankField}
        SORT ${sortByField} ${sortByDirection}
        LIMIT ${offset}, ${limit}
        RETURN finding
    )
    RETURN {
      "nodes": sortedFindings,
      "totalCount": totalCount,
      "hasNextPage": (${limit} + ${offset}) < totalCount,
      "hasPreviousPage": ${offset} > 0
    }
    `

    let cursor
    try {
      cursor = await query`${additionalFindingQuery}`
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to get cursor for additional findings document for domain '${domainId}', error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional finding(s). Please try again.`))
    }

    let additionalFindings
    try {
      additionalFindings = await cursor.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to get additional findings information for ${domainId}, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load additional finding(s). Please try again.`))
    }
    return additionalFindings
  }
