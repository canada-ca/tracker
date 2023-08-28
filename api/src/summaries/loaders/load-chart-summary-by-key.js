import DataLoader from 'dataloader'
import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadChartSummaryByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (key) => {
    const today = aql`${new Date().toISOString().split('T')[0]}`

    let cursor

    try {
      cursor = await query`
        WITH chartSummaries
        FOR summary IN chartSummaries
          FILTER summary.date == ${today}
          RETURN summary
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadChartSummaryByKey: ${err}`)
      throw new Error(i18n._(t`Unable to load summary. Please try again.`))
    }

    let summaries
    try {
      summaries = await cursor.next()
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} running loadChartSummaryByKey: ${err}`)
      throw new Error(i18n._(t`Unable to load summary. Please try again.`))
    }

    return summaries[key]
  })
