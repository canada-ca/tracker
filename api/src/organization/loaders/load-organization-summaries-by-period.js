import { toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadOrganizationSummariesByPeriod =
  ({ query, userKey, cleanseInput, i18n }) =>
  async ({ orgId, period, year }) => {
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

    if (typeof year === 'undefined') {
      console.warn(`User: ${userKey} did not have \`year\` argument set for: loadOrganizationSummariesByPeriod.`)
      throw new Error(i18n._(t`You must provide a \`year\` value to access the \`OrganizationSummaries\` connection.`))
    }
    const periodYear = cleanseInput(year)

    let startDate
    let requestedSummaryInfo
    try {
      if (period === 'thirtyDays') {
        startDate = new Date(new Date().setDate(new Date().getDate() - 30))
        requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            FOR summary IN organizationSummaries
              FILTER summary.organization == ${orgId}
              FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')
              SORT summary.date ASC
              RETURN summary
          )

          RETURN {
            "summaries": retrievedSummaries,
            "totalCount": LENGTH(retrievedSummaries),
          }
        `
      } else if (period === 'lastYear') {
        startDate = new Date(new Date().setDate(new Date().getDate() - 365))
        requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            FOR summary IN organizationSummaries
              FILTER summary.organization == ${orgId}
              FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')
              SORT summary.date ASC
              RETURN summary
          )

          RETURN {
            "summaries": retrievedSummaries,
            "totalCount": LENGTH(retrievedSummaries),
          }
        `
      } else if (period === 'yearToDate') {
        startDate = new Date(`${periodYear}-01-01`)
        requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            FOR summary IN organizationSummaries
              FILTER summary.organization == ${orgId}
              FILTER DATE_FORMAT(summary.date, '%yyyy') >= DATE_FORMAT(${startDate}, '%yyyy')
              SORT summary.date ASC
              RETURN summary
          )

          RETURN {
            "summaries": retrievedSummaries,
            "totalCount": LENGTH(retrievedSummaries),
          }
        `
      } else {
        startDate = new Date(`${periodYear}-${periodMonth}-01`)
        requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            FOR summary IN organizationSummaries
              FILTER summary.organization == ${orgId}
              FILTER DATE_FORMAT(summary.date, "%yyyy-%mm") == DATE_FORMAT(${startDate}, "%yyyy-%mm")
              SORT summary.date ASC
              RETURN summary
          )

          RETURN {
            "summaries": retrievedSummaries,
            "totalCount": LENGTH(retrievedSummaries),
          }
        `
      }
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather organization summaries in loadOrganizationSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization summary data. Please try again.`))
    }

    let summariesInfo
    try {
      summariesInfo = await requestedSummaryInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather organization summaries in loadOrganizationSummariesByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load organization summary data. Please try again.`))
    }

    if (summariesInfo.summaries.length === 0) {
      return {
        edges: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: '',
          endCursor: '',
        },
      }
    }

    const edges = summariesInfo.summaries.map((summary) => {
      summary.startDate = startDate
      return {
        cursor: toGlobalId('organizationSummary', summary._key),
        node: summary,
      }
    })

    return {
      edges,
      totalCount: summariesInfo.totalCount,
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: '',
        endCursor: '',
      },
    }
  }
