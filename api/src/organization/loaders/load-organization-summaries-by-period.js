import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadOrganizationSummariesByPeriod =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ orgId, startDate, endDate, sortDirection = 'ASC' }) => {
    if (typeof startDate === 'undefined' || typeof endDate === 'undefined') {
      console.warn(
        `User: ${userKey} did not have \`startDate\` or \`endDate\` argument set for: loadOrganizationSummariesByPeriod.`,
      )
      throw new Error(
        i18n._(
          t`You must provide both \`startDate\` and \`endDate\` values to access the \`OrganizationSummaries\` connection.`,
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
        LET retrievedSummaries = (
          LET latestSummary = (RETURN DOCUMENT(organizations, ${orgId}).summaries)
          LET historicalSummaries = (
            FOR summary IN organizationSummaries
              FILTER summary.organization == ${orgId}
              FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${cleansedStartDate}, '%yyyy-%mm-%dd')
              FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') <= DATE_FORMAT(${cleansedEndDate}, '%yyyy-%mm-%dd')
              RETURN summary
          )
          FOR summary IN APPEND(latestSummary, historicalSummaries)
            SORT summary.date ${sortString}
            RETURN summary
        )
        RETURN retrievedSummaries
      `
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather organization summaries in loadOrganizationSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization summary data. Please try again.`))
    }

    let summariesInfo
    try {
      summariesInfo = filterUniqueDates(await requestedSummaryInfo.next())
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather organization summaries in loadOrganizationSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization summary data. Please try again.`))
    }

    return summariesInfo || []
  }
