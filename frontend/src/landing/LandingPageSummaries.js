import React from 'react'
import { useQuery } from '@apollo/client'

import { SummaryGroup } from '../summaries/SummaryGroup'
import { WEB_AND_PHASE_SUMMARIES } from '../graphql/queries'

export function LandingPageSummaries() {
  const { _loading, _error, data } = useQuery(WEB_AND_PHASE_SUMMARIES)

  return (
    <SummaryGroup
      web={data?.webSummary}
      mail={data?.mailSummary}
      dmarcPhases={data?.dmarcPhaseSummary}
    />
  )
}
