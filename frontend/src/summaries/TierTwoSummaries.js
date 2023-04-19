import React from 'react'
import { Box } from '@chakra-ui/react'

import { t } from '@lingui/macro'
import { object } from 'prop-types'
import { SummaryGroup } from './SummaryGroup'

export function TierTwoSummaries({ webConnections, ssl, spf, dkim, dmarcPhases }) {
  const makeDmarcPhases = () => {
    let dmarcFailCount = 0
    let dmarcFailPercentage = 0
    dmarcPhases.categories.forEach(({ name, count, percentage }) => {
      if (name !== 'maintain') {
        dmarcFailCount += count
        dmarcFailPercentage += percentage
      }
    })
    const maintain = dmarcPhases.categories.find(({ name }) => name === 'maintain')
    return {
      categories: [
        {
          name: 'fail',
          count: dmarcFailCount,
          percentage: dmarcFailPercentage,
        },
        {
          name: 'pass',
          count: maintain.count,
          percentage: maintain.percentage,
        },
      ],
      total: dmarcPhases.total,
    }
  }

  const webSummaries = [
    {
      id: 'web',
      title: t`Web Connections Summary`,
      description: t`Web connections are configured to use HTTPS and valid HSTS`,
      data: webConnections,
    },
    {
      id: 'web',
      title: t`TLS Summary`,
      description: `TLS certificate is valid and configured to use strong ciphers`,
      data: ssl,
    },
  ]

  const mailSummaries = [
    { id: 'email', title: t`SPF Summary`, description: t`SPF record is configured and valid`, data: spf },
    { id: 'email', title: t`DKIM Summary`, description: t`DKIM record is configured and valid`, data: dkim },
    {
      id: 'email',
      title: t`DMARC Summary`,
      description: t`A DMARC phase of maintain is configured`,
      data: makeDmarcPhases(),
    },
  ]

  return (
    <Box>
      <SummaryGroup summaries={webSummaries} />
      <SummaryGroup summaries={mailSummaries} />
    </Box>
  )
}

TierTwoSummaries.propTypes = {
  webConnections: object,
  ssl: object,
  spf: object,
  dkim: object,
  dmarcPhases: object,
}
