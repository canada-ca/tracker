import React from 'react'

import { t } from '@lingui/macro'
import { object } from 'prop-types'
import { SummaryGroup } from './SummaryGroup'

export function TierThreeSummaries({ web, mail }) {
  const summaries = [
    {
      id: 'web',
      title: t`Web Summary`,
      description: t`Configuration requirements for web sites and services completely met`,
      data: web,
    },
    {
      id: 'email',
      title: t`Email Summary`,
      description: t`Configuration requirements for email services completely met`,
      data: mail,
    },
  ]
  return <SummaryGroup summaries={summaries} />
}

TierThreeSummaries.propTypes = {
  web: object,
  mail: object,
}
