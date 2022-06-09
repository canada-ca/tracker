import React from 'react'
import { useQuery } from '@apollo/client'

import { SummaryGroup } from '../summaries/SummaryGroup'
import { HTTPS_AND_DMARC_SUMMARY } from '../graphql/queries'
import { Box } from '@chakra-ui/react'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'

export function LandingPageSummaries() {
  const { loading, error, data } = useQuery(HTTPS_AND_DMARC_SUMMARY)

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  return (
    <Box w="100%">
      <SummaryGroup
        dmarcPhases={data?.dmarcPhaseSummary}
        https={data?.httpsSummary}
      />
    </Box>
  )
}
