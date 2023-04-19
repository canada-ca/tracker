import React from 'react'
import { t } from '@lingui/macro'

import { object } from 'prop-types'
import { SummaryGroup } from './SummaryGroup'

export function TierOneSummaries({ https, dmarc }) {
  const summaries = [
    {
      id: 'web',
      title: t`HTTPS Configuration Summary`,
      description: t`HTTPS is configured and HTTP connections redirect to HTTPS`,
      data: https,
    },
    {
      id: 'email',
      title: t`DMARC Configuration Summary`,
      description: t`A minimum DMARC policy of “p=none” with at least one address defined as a recipient of aggregate reports`,
      data: dmarc,
    },
  ]

  return <SummaryGroup summaries={summaries} />
}

TierOneSummaries.propTypes = {
  https: object,
  dmarc: object,
}
