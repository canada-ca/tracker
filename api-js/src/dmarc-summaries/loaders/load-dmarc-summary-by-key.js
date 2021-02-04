import DataLoader from 'dataloader'
import { t } from '@lingui/macro'

export const dmarcSumLoaderByKey = (query, userKey, i18n) =>
  new DataLoader(async (keys) => {
    let cursor

    try {
      cursor = await query`
        FOR summary IN dmarcSummaries
          FILTER summary._key IN ${keys}
          RETURN {
            _id: summary._id,
            _key: summary._key,
            _rev: summary._rev,
            _type: "dmarcSummary",
            id: summary._key,
            categoryTotals: summary.categoryTotals
            categoryPercentages: summary.categoryPercentages
          }
      `
    } catch (err) {
      console.error(
        `Database error occurred when user: ${userKey} running dmarcSumLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find dmarc summary. Please try again.`),
      )
    }

    const summaryMap = {}
    try {
      await cursor.each((summary) => {
        summaryMap[summary._key] = summary
      })
    } catch (err) {
      console.error(
        `Cursor error occurred when user: ${userKey} running dmarcSumLoaderByKey: ${err}`,
      )
      throw new Error(
        i18n._(t`Unable to find dmarc summary. Please try again.`),
      )
    }

    return keys.map((key) => summaryMap[key])
  })
