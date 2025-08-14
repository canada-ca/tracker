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
          name: 'pass',
          count: maintain.count,
          percentage: maintain.percentage,
        },
        {
          name: 'fail',
          count: dmarcFailCount,
          percentage: dmarcFailPercentage,
        },
      ],
      total: dmarcPhases.total,
    }
  }

  const webSummaries = [
    {
      id: 'webConnections',
      title: t`Web Connections Summary`,
      description: t`HTTPS is configured, HTTP redirects, and HSTS is enabled`,
      data: webConnections,
    },
    {
      id: 'tls',
      title: t`TLS Summary`,
      description: t`Certificate is valid and configured to use strong protocols, ciphers, and curves`,
      data: ssl,
    },
  ]

  const mailSummaries = [
    { id: 'spf', title: t`SPF Summary`, description: t`SPF record is deployed and valid`, data: spf },
    { id: 'dkim', title: t`DKIM Summary`, description: t`DKIM record and keys are deployed and valid`, data: dkim },
    {
      id: 'email',
      title: t`DMARC Summary`,
      description: t`DMARC policy of quarantine or reject, and all messages from non-mail domain is rejected`,
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
