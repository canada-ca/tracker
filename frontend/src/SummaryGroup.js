import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Heading, Text, Stack, SimpleGrid } from '@chakra-ui/core'
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
      title: 'HTTPS Redirection',
      description: 'Domains that pass the HTTPS requirements',
    },
    {
      title: 'HSTS',
      description: 'Domains that pass the HSTS requirements',
    },
    {
      title: 'HSTS Preloaded',
      description: 'Domains that pass the HSTS requirements',
    },
    {
      title: 'SSL',
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
      reportQty = 2
    } else if (name === 'web') {
      reportQty = 5
    } else {
      reportQty = 3
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
            title={reportData[i].title}
            description={reportData[i].description}
          />
        </Stack>,
      )
    }
    return reports
  }

  return (
    <Stack align="center">
      <Heading>{title}</Heading>
      <Text textAlign={['center']} fontSize="lg">
        {description}
      </Text>
      <br />
      <SimpleGrid columns={{ lg: getReportQty() }} spacing="30px" width="100%">
        {createReports()}
      </SimpleGrid>
      <br />
    </Stack>
  )
}

SummaryGroup.propTypes = {
  name: string,
  title: string,
  description: string,
}
