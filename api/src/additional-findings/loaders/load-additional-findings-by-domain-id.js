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
      throw new Error(i18n._(t`limit must be between 1 and 100`))
    }

    if (typeof offset !== 'number') {
      console.warn(`User: ${userKey} did not set valid \`offset\` argument for: loadAdditionalFindingsByDomainId. `)
      throw new Error(i18n._(t`Must provide numeric offset value`))
    } else if (offset < 0 || offset > 100) {
      console.warn(
        `User: ${userKey} set \`offset\` argument outside accepted range for: loadAdditionalFindingsByDomainId. `,
      )
      throw new Error(i18n._(t`offset must be between 0 and 100`))
    }

    let sortByField = aql``
    if (typeof orderBy !== 'undefined') {
      switch (orderBy.field) {
        case 'confidence':
          sortByField = aql`
            LET confidenceRank = POSITION(["suspected", "probable", "confirmed"], finding.confidence, true)
            SORT confidenceRank ${orderBy.direction}, TO_NUMBER(finding._key) ASC
          `
          break
        case 'severity':
          sortByField = aql`
            LET severityRank = POSITION(["info", "low", "medium", "high", "critical"], finding.severity, true)
            SORT severityRank ${orderBy.direction}, TO_NUMBER(finding._key) ASC
          `
          break
        default:
          sortByField = aql`SORT finding.${orderBy.field} ${orderBy.direction}`
      }
    } else {
      sortByField = aql`SORT TO_NUMBER(finding._key) ASC`
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
        ${sortByField}
        LIMIT ${offset} ${limit}
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
        `User: ${userKey} set \`limit\` argument outside accepted range for: loadAdditionalFindingsByDomainId. `,
      )
      throw new Error()
    }

    let info
    try {
      info = await cursor.next()
    } catch (err) {
      console.error(
        `User: ${userKey} set \`limit\` argument outside accepted range for: loadAdditionalFindingsByDomainId. `,
      )
      throw new Error()
    }
    return info
  }
