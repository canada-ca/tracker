import React from 'react'
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Stack, SimpleGrid, Box } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { string } from 'prop-types'

export function SummaryGroup({ ...props }) {
  const { name } = props
  const { i18n } = useLingui()

  const makeData = () => {
    return {
      categoryTotals: {
        strongExample1: Math.floor(Math.random() * 1000 + 1),
        strongExample2: Math.floor(Math.random() * 1000 + 1),
        // conditionally add moderate categories
        ...(name !== 'web' && {
          moderateExample1:
            name === 'web' ? null : Math.floor(Math.random() * 300 + 1),
          moderateExample2:
            name === 'web' ? null : Math.floor(Math.random() * 300 + 1),
        }),
        weakExample: Math.floor(Math.random() * 500 + 1),
      },
      strengths: {
        strong: {
          types: ['strongExample1', 'strongExample2'],
          name:
            name === 'web' ? i18n._(t`Enforced`) : i18n._(t`Fully Implemented`),
        },
        // conditionally add moderate strength
        ...(name !== 'web' && {
          moderate: {
            types: ['moderateExample1', 'moderateExample2'],
            name: 'Partially Implemented',
          },
        }),
        weak: {
          types: ['weakExample'],
          name:
            name === 'web'
              ? i18n._(t`Not Enforced`)
              : i18n._(t`Not Implemented`),
        },
      },
    }
  }

  const dashOverview = [
    {
      title: i18n._(t`Web Configuration`),
      description: i18n._(t`Web encryption settings summary`),
    },
    {
      title: i18n._(t`Email Configuration`),
      description: i18n._(t`Email security settings summary`),
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

  const createReports = () => {
    const reports = []
    const reportData =
      name === 'dashboard'
        ? dashOverview
        : name === 'web'
        ? webOverview
        : emailOverview

    reportData.forEach((dataEntry) => {
      reports.push(
        <SummaryCard
          name={name}
          key={dataEntry.title}
          title={dataEntry.title}
          description={dataEntry.description}
          data={makeData()}
          slider={false}
        />,
      )
    })
    return reports
  }

  return (
    <Box>
      <Stack textAlign="center" align="center">
        <SimpleGrid columns={[1, 1, 1, 1, 2]} spacing="30px">
          {createReports()}
        </SimpleGrid>
        )
      </Stack>
    </Box>
  )
}

SummaryGroup.propTypes = {
  name: string,
  title: string,
  description: string,
}
