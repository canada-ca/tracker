import { t } from '@lingui/macro'

export const loadDmarcSummaryEdgeByDomainIdAndPeriod = ({
  query,
  userKey,
  i18n,
}) => async ({ domainId, startDate }) => {
  let summaryEdgeCursor
  try {
    summaryEdgeCursor = await query`
      WITH dmarcSummaries, domains, domainsToDmarcSummaries
      FOR edge IN domainsToDmarcSummaries
        FILTER edge.startDate == ${startDate}
        FILTER edge._from == ${domainId}
        RETURN edge
    `
  } catch (err) {
    console.error(
      `Database error occurred when user: ${userKey} attempted to load dmarc summaries for domain: ${domainId}, period: ${startDate}, ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load DMARC summary data. Please try again.`),
    )
  }

  let summaryEdge
  try {
    summaryEdge = await summaryEdgeCursor.next()
  } catch (err) {
    console.error(
      `Cursor error occurred when user: ${userKey} attempted to load dmarc summaries for domain: ${domainId}, period: ${startDate}, ${err}`,
    )
    throw new Error(
      i18n._(t`Unable to load DMARC summary data. Please try again.`),
    )
  }

  return summaryEdge
}
