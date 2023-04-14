import React from 'react'
import { Box, Flex } from '@chakra-ui/react'
import { useQuery } from '@apollo/client'
import { SummaryCard } from './SummaryCard'

// import theme from '../theme/canada'
import { LoadingMessage } from '../components/LoadingMessage'
import { ErrorFallbackMessage } from '../components/ErrorFallbackMessage'
import { TIER_THREE_SUMMARY } from '../graphql/queries'
import { t } from '@lingui/macro'

export function TierThreeSummaries() {
  //   const { colors } = theme
  const failColour = '#22485B'
  const passColour = '#F15E6B'
  const { loading, error, data } = useQuery(TIER_THREE_SUMMARY)
  if (loading) return <LoadingMessage />
  if (error) return <ErrorFallbackMessage error={error} />
  console.log(JSON.stringify(data))
  const { webSummary, mailSummary } = data

  return (
    <Box>
      <Flex direction={{ base: 'column', md: 'row' }} justify="space-evenly" align="stretch" w="100%" mb={6}>
        <SummaryCard
          id="webSummary"
          title={t`Web Summary`}
          description={t`Web guidance is compliant`}
          categoryDisplay={{
            fail: {
              name: t`Non-compliant`,
              color: failColour,
            },
            pass: {
              name: t`Compliant`,
              color: passColour,
            },
          }}
          data={webSummary}
          mb={{ base: 6, md: 0 }}
        />

        <SummaryCard
          id="mailSummary"
          title={t`Mail Summary`}
          description={t`Mail guidance is compliant`}
          categoryDisplay={{
            fail: {
              name: t`Non-compliant`,
              color: failColour,
            },
            pass: {
              name: t`Compliant`,
              color: passColour,
            },
          }}
          data={mailSummary}
          mb={{ base: 6, md: 0 }}
        />
      </Flex>
    </Box>
  )
}
