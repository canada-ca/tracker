import { t } from '@lingui/macro'

export const loadDmarcYearlySumEdge =
  ({ query, userKey, i18n }) =>
  async ({ domainId }) => {
    let dmarcSummaryEdgeCursor
    try {
      dmarcSummaryEdgeCursor = await query`
      WITH dmarcSummaries, domains, domainsToDmarcSummaries
      FOR edge IN domainsToDmarcSummaries
        FILTER edge.startDate != "thirtyDays"
        FILTER edge._from == ${domainId}
        RETURN edge
    `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} attempted to load yearly dmarc summaries for domain: ${domainId}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DMARC summary data. Please try again.`),
      )
    }

    let dmarcSummaryEdges
    try {
      dmarcSummaryEdges = await dmarcSummaryEdgeCursor.all()
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} attempted to load yearly dmarc summaries for domain: ${domainId}, ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to load DMARC summary data. Please try again.`),
      )
    }

    return dmarcSummaryEdges
  }
