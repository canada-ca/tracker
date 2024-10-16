import { t } from '@lingui/macro'
import { aql } from 'arangojs'

export const loadOrganizationSummariesByPeriod =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ orgId, period, year, sortDirection }) => {
    if (typeof period === 'undefined') {
      console.warn(`User: ${userKey} did not have \`period\` argument set for: loadOrganizationSummariesByPeriod.`)
      throw new Error(
        i18n._(t`You must provide a \`period\` value to access the \`OrganizationSummaries\` connection.`),
      )
    }
    const cleansedPeriod = cleanseInput(period)
    const monthMap = {
      january: '01',
      february: '02',
      march: '03',
      april: '04',
      may: '05',
      june: '06',
      july: '07',
      august: '08',
      september: '09',
      october: '10',
      november: '11',
      december: '12',
    }
    const periodMonth = monthMap[cleansedPeriod]

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

    if (typeof year === 'undefined') {
      console.warn(`User: ${userKey} did not have \`year\` argument set for: loadOrganizationSummariesByPeriod.`)
      throw new Error(i18n._(t`You must provide a \`year\` value to access the \`OrganizationSummaries\` connection.`))
    }
    const periodYear = cleanseInput(year)

    let sortString
    if (typeof last !== 'undefined') {
      sortString = aql`DESC`
    } else {
      sortString = aql`${sortDirection}`
    }

    let startDate
    let requestedSummaryInfo

    switch (period) {
      case 'thirtyDays':
        startDate = new Date(new Date().setDate(new Date().getDate() - 30))
        break
      case 'lastYear':
        startDate = new Date(new Date().setDate(new Date().getDate() - 365))
        break
      case 'yearToDate':
        startDate = new Date(`${periodYear}-01-01`)
        break
      default:
        startDate = new Date(`${periodYear}-${periodMonth}-01`)
        break
    }

    try {
      requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            LET latestSummary = (RETURN DOCUMENT(organizations, ${orgId}).summaries)
            LET historicalSummaries = (
              FOR summary IN organizationSummaries
                FILTER summary.organization == ${orgId}
                FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate.toISOString()}, '%yyyy-%mm-%dd')
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
