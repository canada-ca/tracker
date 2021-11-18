import React from 'react'
import { useQuery } from '@apollo/client'

import { SummaryGroup } from '../summaries/SummaryGroup'
import { HTTPS_AND_DMARC_SUMMARY } from '../graphql/queries'

export function LandingPageSummaries() {
  const { _loading, _error, data } = useQuery(HTTPS_AND_DMARC_SUMMARY)

  return (
    <SummaryGroup
      dmarcPhases={data?.dmarcPhaseSummary}
      https={data?.httpsSummary}
    />
  )
}
