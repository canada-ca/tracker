import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadOrganizationSummariesByPeriod =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ orgId, startDate, endDate, sortDirection = 'ASC', limit }) => {
    const cleansedStartDate = startDate ? cleanseInput(startDate) : null
    const cleansedEndDate = endDate ? cleanseInput(endDate) : new Date().toISOString()

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
    let startDateFilter = aql``
    if (typeof cleansedStartDate !== 'undefined') {
      startDateFilter = aql`FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${cleansedStartDate}, '%yyyy-%mm-%dd')`
    }
    let endDateFilter = aql``
    if (typeof cleansedEndDate !== 'undefined') {
      endDateFilter = aql`FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') <= DATE_FORMAT(${cleansedEndDate}, '%yyyy-%mm-%dd')`
    }
    let limitString = aql``
    if (typeof limit !== 'undefined') {
      limitString = aql`LIMIT ${limit}`
    }

    let requestedSummaryInfo
    try {
      requestedSummaryInfo = await query`
        LET latestSummary = (RETURN DOCUMENT(organizations, ${orgId}).summaries)
        LET historicalSummaries = (
          FOR summary IN organizationSummaries
            FILTER summary.organization == ${orgId}
            ${startDateFilter}
            ${endDateFilter}
            RETURN summary
        )
        FOR summary IN APPEND(latestSummary, historicalSummaries)
          ${sortString}
          ${limitString}
          RETURN summary
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather organization summaries in loadOrganizationSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization summary data. Please try again.`))
    }

    let summariesInfo
    try {
      summariesInfo = filterUniqueDates(await requestedSummaryInfo.all())
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather organization summaries in loadOrganizationSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization summary data. Please try again.`))
    }

    return summariesInfo || []
  }
