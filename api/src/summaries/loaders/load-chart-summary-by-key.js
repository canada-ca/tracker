import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const loadChartSummaryByKey = ({ query, userKey, i18n }) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH chartSummaries
        FOR summary IN chartSummaries
          SORT summary.date DESC LIMIT 1
          RETURN summary
      `
    } catch (err) {
      console.error(`Database error occurred when user: ${userKey} running loadChartSummaryByKey: ${err}`)
      throw new Error(i18n._(t`Unable to load summary. Please try again.`))
    }

    let summariesMap
    try {
      summariesMap = await cursor.next()
    } catch (err) {
      console.error(`Cursor error occurred when user: ${userKey} running loadChartSummaryByKey: ${err}`)
      throw new Error(i18n._(t`Unable to load summary. Please try again.`))
    }

    return keys.map((key) => summariesMap[key])
  })
