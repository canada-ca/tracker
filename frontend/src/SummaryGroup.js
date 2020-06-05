import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Text, Stack, SimpleGrid } from '@chakra-ui/core'
import { SummaryCard } from './SummaryCard'
import { string } from 'prop-types'

export function SummaryGroup({ ...props }) {
  const { name, title, description } = props
  const { i18n } = useLingui()

  const dashOverview = [
    {
      title: i18n._(t`Web Configuration`),
      description: i18n._(t`Amalgomation of all web security factors`),
    },
    {
      title: i18n._(t`Email Conifguration`),
      description: i18n._(t`Amalgomation of all email security factors`),
    },
  ]

  const webOverview = [
    {
      title: 'HTTPS',
      description: 'description',
    },
    {
      title: 'HSTS',
      description: 'description',
    },
    {
      title: i18n._(t`HSTS Preloaded`),
      description: 'description',
    },
    {
      title: 'SSL',
      description: 'description',
    },
    {
      title: i18n._(t`Protocols & Ciphers`),
      description: 'description',
    },
    {
      title: i18n._(t`Approved Certificate Use`),
      description: 'description',
    },
  ]

  const emailOverview = [
    {
      title: 'SPF',
      description: 'description',
    },
    {
      title: 'DKIM',
      description: 'description',
    },
    {
      title: 'DMARC',
      description: 'description',
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
      <SimpleGrid
        columns={{ lg: name === 'web' ? getReportQty() / 2 : getReportQty() }}
        spacing="30px"
        width="110%"
      >
        {createReports()}
      </SimpleGrid>
      )
      <br />
    </Stack>
  )
}

SummaryGroup.propTypes = {
  name: string,
  title: string,
  description: string,
}
