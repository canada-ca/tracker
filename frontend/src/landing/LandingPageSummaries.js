import React, { useState } from 'react'
import { useQuery } from '@apollo/client'

import { LANDING_PAGE_SUMMARIES, GET_HISTORICAL_CHART_SUMMARIES } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TieredSummaries } from '../summaries/TieredSummaries'
import { Box } from '@chakra-ui/react'
import { HistoricalSummariesGraph } from '../summaries/HistoricalSummariesGraph'
import { ErrorBoundary } from 'react-error-boundary'
import { ABTestVariant, ABTestWrapper } from '../app/ABTestWrapper'

export function LandingPageSummaries() {
  const [progressChartRange, setProgressChartRange] = useState('LAST30DAYS')
  const { loading, error, data } = useQuery(LANDING_PAGE_SUMMARIES)
  const { data: historicalSummaries, loading: histSumLoading } = useQuery(GET_HISTORICAL_CHART_SUMMARIES, {
    variables: { month: progressChartRange, year: new Date().getFullYear().toString() },
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
      <ABTestWrapper insiderVariantName="B">
        <ABTestVariant name="B">
          {histSumLoading ? (
            <LoadingMessage height={500} />
          ) : (
            <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
              <HistoricalSummariesGraph
                data={historicalSummaries?.findChartSummaries}
                setRange={setProgressChartRange}
                width={1200}
                height={500}
              />
            </ErrorBoundary>
          )}
        </ABTestVariant>
      </ABTestWrapper>
    </Box>
  )
}
