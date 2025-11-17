import React from 'react'
import { useQuery } from '@apollo/client'

import { LANDING_PAGE_SUMMARIES, GET_HISTORICAL_CHART_SUMMARIES } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TieredSummaries } from '../summaries/TieredSummaries'
import { Box } from '@chakra-ui/react'
import { HistoricalSummariesGraph } from '../summaries/HistoricalSummariesGraph'
import { ErrorBoundary } from 'react-error-boundary'
import useSearchParam from '../utilities/useSearchParam'
import { getRangeDates } from '../helpers/getDateRange'

export function LandingPageSummaries() {
  const { loading, error, data } = useQuery(LANDING_PAGE_SUMMARIES)
  const { searchValue: progressChartRangeParam, setSearchParams: setProgressChartRangeParam } = useSearchParam({
    name: 'summary-range',
    validOptions: ['last30days', 'lastyear', 'ytd', 'all'],
    defaultValue: 'last30days',
  })
  const { startDate, endDate } = getRangeDates(progressChartRangeParam)
  const { data: historicalSummaries, loading: histSumLoading } = useQuery(GET_HISTORICAL_CHART_SUMMARIES, {
    variables: { startDate, endDate, sortDirection: 'DESC' },
  })

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  const summaries = {
    https: data?.httpsSummary,
    dmarc: data?.dmarcSummary,
    webConnections: data?.webConnectionsSummary,
    ssl: data?.sslSummary,
    spf: data?.spfSummary,
    dkim: data?.dkimSummary,
    dmarcPhase: data?.dmarcPhaseSummary,
    web: data?.webSummary,
    mail: data?.mailSummary,
  }

  return (
    <Box>
      <TieredSummaries summaries={summaries} />
      {histSumLoading ? (
        <LoadingMessage height={500} />
      ) : (
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <HistoricalSummariesGraph
            data={historicalSummaries?.findChartSummaries}
            setRange={setProgressChartRangeParam}
            selectedRange={progressChartRangeParam}
            width={1200}
            height={500}
          />
        </ErrorBoundary>
      )}
    </Box>
  )
}
