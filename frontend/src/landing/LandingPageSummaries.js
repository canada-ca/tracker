import React from 'react'
import { useQuery } from '@apollo/client'

import { LANDING_PAGE_SUMMARIES, GET_HISTORICAL_CHART_SUMMARIES, IS_USER_SUPER_ADMIN } from '../graphql/queries'
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
  const { data: superAdminData } = useQuery(IS_USER_SUPER_ADMIN)
  const isSuperAdmin = Boolean(superAdminData?.isUserSuperAdmin)

  const { searchValue: progressChartRangeParam, setSearchParams: setProgressChartRangeParam } = useSearchParam({
    name: 'summary-range',
    validOptions: ['last30days', 'lastyear', 'ytd', 'all'],
    defaultValue: 'last30days',
  })
  const { searchValue: sourceParam, setSearchParams: setSourceParam } = useSearchParam({
    name: 'summary-source',
    validOptions: ['live', 'backfill', 'both'],
    defaultValue: 'live',
  })
  const { startDate, endDate } = getRangeDates(progressChartRangeParam)

  const showLive = !isSuperAdmin || sourceParam !== 'backfill'
  const showBackfill = isSuperAdmin && (sourceParam === 'backfill' || sourceParam === 'both')

  const { data: liveSummaries, loading: liveLoading } = useQuery(GET_HISTORICAL_CHART_SUMMARIES, {
    variables: { startDate, endDate, sortDirection: 'DESC', source: 'LIVE' },
    skip: !showLive,
  })
  const { data: backfillSummaries, loading: backfillLoading } = useQuery(GET_HISTORICAL_CHART_SUMMARIES, {
    variables: { startDate, endDate, sortDirection: 'DESC', source: 'REBUILD' },
    skip: !showBackfill,
  })

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  const summaries = data?.findChartSummaries?.[0]

  const liveData = liveSummaries?.findChartSummaries
  const backfillData = backfillSummaries?.findChartSummaries

  let graphData = liveData
  let overlayData = null
  if (showBackfill && sourceParam === 'backfill') {
    graphData = backfillData
  } else if (showBackfill && sourceParam === 'both') {
    overlayData = backfillData
  }

  const histSumLoading = (showLive && liveLoading) || (showBackfill && backfillLoading)

  return (
    <Box>
      <TieredSummaries summaries={summaries} />
      {histSumLoading ? (
        <LoadingMessage height={500} />
      ) : (
        <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
          <HistoricalSummariesGraph
            data={graphData || []}
            overlayData={overlayData}
            isSuperAdmin={isSuperAdmin}
            sourceParam={sourceParam}
            setSourceParam={setSourceParam}
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
