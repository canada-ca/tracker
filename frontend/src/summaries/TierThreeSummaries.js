import React from 'react'

import { t } from '@lingui/macro'
import { object } from 'prop-types'
import { SummaryGroup } from './SummaryGroup'

export function TierThreeSummaries({ web, mail }) {
  const summaries = [
    {
      id: 'web',
      title: t`Web Summary`,
      description: t`Service configuration is fully compliant with the Web Security Policy in Appendix G`,
      data: web,
    },
    {
      id: 'email',
      title: t`Mail Summary`,
      description: t`Service configuration is fully compliant with the Mail Security Policy in Appendix G`,
      data: mail,
    },
  ]
  return <SummaryGroup summaries={summaries} />
}

TierThreeSummaries.propTypes = {
  web: object,
  mail: object,
}
