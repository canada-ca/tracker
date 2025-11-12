import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadChartSummariesByPeriod =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ startDate, endDate, sortDirection = 'ASC', limit }) => {
    const cleansedStartDate = startDate != null ? cleanseInput(startDate) : null
    const cleansedEndDate = endDate != null ? cleanseInput(endDate) : null

    const filterUniqueDates = (array) => {
      const filteredArray = []
      const dateSet = new Set()
      array.forEach((item) => {
        if (!dateSet.has(item.date)) {
          filteredArray.push(item)
          dateSet.add(item.date)
        }
      })
      return filteredArray
    }

    const sortString = aql`SORT summary.date ${sortDirection}`
    let limitString
    if (typeof limit !== 'undefined') {
      limitString = aql`LIMIT ${limit}`
    }

    let requestedSummaryInfo
    try {
      requestedSummaryInfo = await query`
        FOR summary IN chartSummaries
          ${
            cleansedStartDate
              ? aql`FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${cleansedStartDate}, '%yyyy-%mm-%dd')`
              : aql``
          }
          ${
            cleansedEndDate
              ? aql`FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') <= DATE_FORMAT(${cleansedEndDate}, '%yyyy-%mm-%dd')`
              : aql``
          }
          ${sortString}
          ${limitString}
          RETURN MERGE({ id: summary._key }, DOCUMENT(summary._id))
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather chart summaries in loadChartSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load chart summary data. Please try again.`))
    }

    let summariesInfo = []
    try {
      summariesInfo = filterUniqueDates(await requestedSummaryInfo.all())
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather chart summaries in loadChartSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load chart summary data. Please try again.`))
    }

    return summariesInfo
  }
