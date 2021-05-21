import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadDmarcSummaryByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH dmarcSummaries, domains, domainsToDmarcSummaries
        FOR summary IN dmarcSummaries
          FILTER summary._key IN ${keys}

          LET edge = (
            FOR v, e IN 1..1 ANY summary._id domainsToDmarcSummaries
              RETURN e
          )

          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            startDate: FIRST(edge).startDate,
            domainKey: PARSE_IDENTIFIER(FIRST(edge)._from).key,
            categoryTotals: summary.categoryTotals,
            categoryPercentages: summary.categoryPercentages,
            totalMessages: summary.totalMessages
          }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadDmarcSummaryByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DMARC summary data. Please try again.`),
      )
    }

    const summaryMap = {}
    try {
      await cursor.forEach((summary) => {
        summaryMap[summary._key] = summary
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadDmarcSummaryByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find DMARC summary data. Please try again.`),
      )
    }

    return keys.map((key) => summaryMap[key])
  })
