import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadChartSummariesByPeriod =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ startDate, endDate, sortDirection = 'ASC' }) => {
    if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
      console.warn(
        `User: ${userKey} did not have \`startDate\` or \`endDate\` argument set for: loadChartSummariesByPeriod.`,
      )
      throw new Error(
        i18n._(
          t`You must provide both \`startDate\` and \`endDate\` values to access the \`ChartSummaries\` connection.`,
        ),
      )
    }
    const cleansedStartDate = cleanseInput(startDate)
    const cleansedEndDate = cleanseInput(endDate)

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

    const sortString = aql`${sortDirection}`

    let requestedSummaryInfo
    try {
      requestedSummaryInfo = await query`
        FOR summary IN chartSummaries
          FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${cleansedStartDate}, '%yyyy-%mm-%dd')
          FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') <= DATE_FORMAT(${cleansedEndDate}, '%yyyy-%mm-%dd')
          SORT summary.date ${sortString}
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
