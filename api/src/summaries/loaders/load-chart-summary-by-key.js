import DataLoader from 'dataloader'
import {t} from '@lingui/macro'

export const loadChartSummaryByKey = ({query, userKey, i18n}) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        WITH chartSummaries
        FOR summary IN chartSummaries
          FILTER summary._key IN ${keys}
          RETURN MERGE({ id: summary._key }, summary)
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running loadChartSummaryByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load summary. Please try again.`))
    }

    const summaryMap = {}
    try {
      await cursor.forEach((summary) => {
        summaryMap[summary._key] = summary
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running loadChartSummaryByKey: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load summary. Please try again.`))
    }

    return keys.map((key) => summaryMap[key])
  })
