import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'
import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TIER_TWO_SUMMARY } from '../graphql/queries'
import { t } from '@lingui/macro'

export function TierTwoSummaries() {
  const { colors } = theme
  const { loading, error, data } = useQuery(TIER_TWO_SUMMARY)
  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />
  const { webConnectionsSummary, sslSummary, spfSummary, dkimSummary, dmarcPhaseSummary } = data

  const categoryDisplay = {
    fail: {
      name: t`Non-compliant`,
      color: colors.summaries.fail,
    },
    pass: {
      name: t`Compliant`,
      color: colors.summaries.pass,
    },
  }

  const dmarcPhases = () => {
    let dmarcFailCount = 0
    let dmarcFailPercentage = 0
    dmarcPhaseSummary.categories.forEach(({ name, count, percentage }) => {
      if (name !== 'maintain') {
        dmarcFailCount += count
        dmarcFailPercentage += percentage
      }
    })
    const maintain = dmarcPhaseSummary.categories.find(({ name }) => name === 'maintain')
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
      total: dmarcPhaseSummary.total,
    }
  }

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="webConnectionsSummary"
          title={t`Web Connections Summary`}
          description={t`Web connections are configured to use HTTPS and valid HSTS`}
          categoryDisplay={categoryDisplay}
          data={webConnectionsSummary}
          mb={{ base: 6, md: 0 }}
        />

        <SummaryCard
          id="sslSummary"
          title={t`TLS Summary`}
          description={t`TLS certificate is valid and configured to use strong ciphers`}
          categoryDisplay={categoryDisplay}
          data={sslSummary}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="spfSummary"
          title={t`SPF Summary`}
          description={t`SPF record is configured and valid`}
          categoryDisplay={categoryDisplay}
          data={spfSummary}
          mb={{ base: 6, md: 0 }}
        />
        <SummaryCard
          id="dkimSummary"
          title={t`DKIM Summary`}
          description={t`DKIM record is configured and valid`}
          categoryDisplay={categoryDisplay}
          data={dkimSummary}
          mb={{ base: 6, md: 0 }}
        />
        <SummaryCard
          id="dmarcPhaseSummary"
          title={t`DMARC Summary`}
          description={t`A DMARC phase of maintain is configured`}
          categoryDisplay={categoryDisplay}
          data={dmarcPhases()}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
    </Box>
  )
}
