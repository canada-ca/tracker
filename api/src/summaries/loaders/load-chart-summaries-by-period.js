import { toGlobalId } from 'graphql-relay'
import { t } from '@lingui/macro'

export const loadChartSummaryConnectionsByPeriod =
  ({ query, userKey, cleanseInput, i18n, loadStartDateFromPeriod }) =>
  async ({ period, year }) => {
    if (typeof period === 'undefined') {
      console.warn(`User: ${userKey} did not have \`period\` argument set for: loadChartSummaryConnectionsByPeriod.`)
      throw new Error(i18n._(t`You must provide a \`period\` value to access the \`ChartSummaries\` connection.`))
    }
    const cleansedPeriod = cleanseInput(period)

    if (typeof year === 'undefined') {
      console.warn(`User: ${userKey} did not have \`year\` argument set for: loadChartSummaryConnectionsByPeriod.`)
      throw new Error(i18n._(t`You must provide a \`year\` value to access the \`ChartSummaries\` connection.`))
    }
    const cleansedYear = cleanseInput(year)

    const startDate = loadStartDateFromPeriod({
      period: cleansedPeriod,
      year: cleansedYear,
    })

    let requestedSummaryInfo
    try {
      if (period === 'thirtyDays') {
        requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            FOR summary IN chartSummaries
              FILTER DATE_FORMAT(summary.date, '%yyyy-%mm-%dd') >= DATE_FORMAT(${startDate}, '%yyyy-%mm-%dd')
              RETURN {
                id: summary._key,
                date: summary.date,
                https: summary.https,
                dmarc: summary.dmarc,
              }
          )

          RETURN {
            "summaries": retrievedSummaries,
            "totalCount": LENGTH(retrievedSummaries),
          }
        `
      } else {
        const periodMonth = startDate.split('-')[1]
        const periodYear = startDate.split('-')[0]
        requestedSummaryInfo = await query`
          LET retrievedSummaries = (
            FOR summary IN chartSummaries
              FILTER DATE_FORMAT(summary.date, "%yyyy-%mm") == ${periodYear}-${periodMonth}
              RETURN {
                id: summary._key,
                date: summary.date,
                https: summary.https,
                dmarc: summary.dmarc,
              }
          )

          RETURN {
            "summaries": retrievedSummaries,
            "totalCount": LENGTH(retrievedSummaries),
          }
        `
      }
    } catch (err) {
      console.error(
        `Database error occurred while user: ${userKey} was trying to gather chart summaries in loadChartSummaryConnectionsByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load chart summary data. Please try again.`))
    }

    let summariesInfo
    try {
      summariesInfo = await requestedSummaryInfo.next()
    } catch (err) {
      console.error(
        `Cursor error occurred while user: ${userKey} was trying to gather chart summaries in loadChartSummaryConnectionsByPeriod, error: ${err}`,
      )
      throw new Error(i18n._(t`Unable to load chart summary data. Please try again.`))
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
        cursor: toGlobalId('chartSummary', summary.id),
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
