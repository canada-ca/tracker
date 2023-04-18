import React from 'react'
import { useQuery } from '@apollo/client'

import { HTTPS_AND_DMARC_SUMMARY } from '../graphql/queries'
import { Box } from '@chakra-ui/react'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { t } from '@lingui/macro'
import { Flex } from '@chakra-ui/react'

import { SummaryCard } from '../summaries/SummaryCard'

import theme from '../theme/canada'

export function LandingPageSummaries() {
  const { loading, error, data } = useQuery(HTTPS_AND_DMARC_SUMMARY)

  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />

  const { colors } = theme

  return (
    <Box w="100%">
      <Flex flexWrap="wrap" justifyContent="space-evenly">
        <SummaryCard
          id="httpsStatus"
          title={t`HTTPS Configuration Summary`}
          description={t`HTTPS is configured and HTTP connections redirect to HTTPS`}
          categoryDisplay={{
            fail: {
              name: t`Non-compliant`,
              color: colors.summaries.fail,
            },
            pass: {
              name: t`Compliant`,
              color: colors.summaries.pass,
            },
          }}
          data={data.httpsSummary}
          mb={{ base: 6, md: 0 }}
        />
        <SummaryCard
          title={t`DMARC Configuration Summary`}
          description={t`A minimum DMARC policy of “p=none” with at least one address defined as a recipient of aggregate reports`}
          categoryDisplay={{
            fail: {
              name: t`Not Implemented`,
              color: colors.summaries.fail,
            },
            pass: {
              name: t`Implemented`,
              color: colors.summaries.pass,
            },
          }}
          data={data.dmarcSummary}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
    </Box>
  )
}
