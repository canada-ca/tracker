import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, SimpleGrid } from '@chakra-ui/core'
import { SummaryCard } from './SummaryCard'
import { string } from 'prop-types'

export function SummaryGroup({ ...props }) {
  const { name, title, description } = props

  const dashOverview = [
    {
      title: 'Web Configuration',
      description: 'Amalgomation of all web security factors',
    },
    {
      title: 'Email Conifguration',
      description: 'Amalgomation of all email security factors',
    },
  ]

  const webOverview = [
    {
      title: 'HTTPS',
      description: 'Domains that pass the HTTPS requirements',
    },
    {
      title: 'HSTS',
      description: 'Domains that pass the HSTS requirements',
    },
    {
      title: 'HSTS Preloaded',
      description: 'Domains that pass the HSTS Preloaded requirements',
    },
    {
      title: 'SSL',
      description: 'Domains that pass the SSL requirements',
    },
    {
      title: 'Protocols & Ciphers',
      description: 'Domains that pass the SSL requirements',
    },
    {
      title: 'Approved Certificate Use',
      description: 'Domains that pass the SSL requirements',
    },
  ]

  const emailOverview = [
    {
      title: 'DMARC',
      description: 'Domains that pass the DMARC requirements',
    },
    {
      title: 'DKIM',
      description: 'Domains that pass the DKIM requirements',
    },
    {
      title: 'SPF',
      description: 'Domains that pass the SPF requirements',
    },
  ]

  const getReportQty = () => {
    let reportQty
    if (name === 'dashboard') {
      reportQty = dashOverview.length
    } else if (name === 'web') {
      reportQty = webOverview.length
    } else {
      reportQty = emailOverview.length
    }
    return reportQty
  }

  const createReports = () => {
    const reports = []
    let reportData
    if (name === 'dashboard') {
      reportData = dashOverview
    } else if (name === 'web') {
      reportData = webOverview
    } else {
      reportData = emailOverview
    }

    for (let i = 0; i < getReportQty(); i++) {
      reports.push(
        <Stack align="center">
          <SummaryCard
            name={name}
            title={reportData[i].title}
            description={reportData[i].description}
          />
        </Stack>,
      )
    }
    return reports
  }

  return (
    <Stack textAlign={'center'} align="center">
      <Text fontSize="3xl" fontWeight="bold">
        {title}
      </Text>
      <Text fontSize="lg">{description}</Text>
      <br />
      {name !== 'web' && (
        <SimpleGrid
          columns={{ lg: getReportQty() }}
          spacing="30px"
          width="110%"
        >
          {createReports()}
        </SimpleGrid>
      )}
      {name === 'web' && (
        <SimpleGrid
          columns={{ lg: getReportQty() / 2 }}
          spacing="30px"
          width="110%"
        >
          {createReports()}
        </SimpleGrid>
      )}

      <br />
    </Stack>
  )
}

SummaryGroup.propTypes = {
  name: string,
  title: string,
  description: string,
}
