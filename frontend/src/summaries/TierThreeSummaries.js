import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'
import { SummaryCard } from './SummaryCard'

import theme from '../theme/canada'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TIER_THREE_SUMMARY } from '../graphql/queries'
import { t } from '@lingui/macro'

export function TierThreeSummaries() {
  const { colors } = theme
  const { loading, error, data } = useQuery(TIER_THREE_SUMMARY)
  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />
  const { webSummary, mailSummary } = data

  return (
    <Box w="100%">
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="webSummary"
          title={t`Web Summary`}
          description={t`Service configuration is fully compliant with the Web Security Policy in Appendix G`}
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
          data={webSummary}
          mb={{ base: 6, md: 0 }}
        />

        <SummaryCard
          id="mailSummary"
          title={t`Mail Summary`}
          description={t`Service configuration is fully compliant with the Mail Security Policy in Appendix G`}
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
          data={mailSummary}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
    </Box>
  )
}
