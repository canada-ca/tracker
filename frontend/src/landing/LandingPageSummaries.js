import React from 'react'
import { useQuery } from '@apollo/client'

import { LANDING_PAGE_SUMMARIES } from '../graphql/queries'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TieredSummaries } from '../summaries/TieredSummaries'

export function LandingPageSummaries() {
  const { loading, error, data } = useQuery(LANDING_PAGE_SUMMARIES)

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

  return <TieredSummaries summaries={summaries} />
}
