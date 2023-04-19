import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'
import { t } from '@lingui/macro'
import { object } from 'prop-types'

export function TierTwoSummaries({ webConnections, ssl, spf, dkim, dmarcPhases }) {
  const { colors } = theme

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

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="webConnectionsSummary"
          title={t`Web Connections Summary`}
          description={t`Web connections are configured to use HTTPS and valid HSTS`}
          categoryDisplay={categoryDisplay}
          data={webConnections}
          mb={{ base: 6, md: 0 }}
        />

        <SummaryCard
          id="sslSummary"
          title={t`TLS Summary`}
          description={t`TLS certificate is valid and configured to use strong ciphers`}
          categoryDisplay={categoryDisplay}
          data={ssl}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="spfSummary"
          title={t`SPF Summary`}
          description={t`SPF record is configured and valid`}
          categoryDisplay={categoryDisplay}
          data={spf}
          mb={{ base: 6, md: 0 }}
        />
        <SummaryCard
          id="dkimSummary"
          title={t`DKIM Summary`}
          description={t`DKIM record is configured and valid`}
          categoryDisplay={categoryDisplay}
          data={dkim}
          mb={{ base: 6, md: 0 }}
        />
        <SummaryCard
          id="dmarcPhaseSummary"
          title={t`DMARC Summary`}
          description={t`A DMARC phase of maintain is configured`}
          categoryDisplay={{
            fail: {
              name: t`Not implemented`,
              color: colors.summaries.fail,
            },
            pass: {
              name: t`Implemented`,
              color: colors.summaries.pass,
            },
          }}
          data={makeDmarcPhases()}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
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
