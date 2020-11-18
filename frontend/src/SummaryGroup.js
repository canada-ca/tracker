import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useToast, SimpleGrid } from '@chakra-ui/core'
import SummaryCard from './SummaryCard'
import { string } from 'prop-types'
import theme from './theme/canada'
import { useQuery } from '@apollo/client'
import { WEB_AND_EMAIL_SUMMARIES } from './graphql/queries'
import { LoadingMessage } from './LoadingMessage'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'

const { colors } = theme

export function SummaryGroup() {
  const toast = useToast()

  const { loading, error, data } = useQuery(WEB_AND_EMAIL_SUMMARIES, {
    onError: ({ message }) => {
      toast({
        title: 'Error',
        description: message,
        status: 'error',
        duration: 9000,
        isClosable: true,
        position: 'top-left',
      })
    },
  })

  if (error) return <ErrorFallbackMessage error={error} />

  if (loading) {
    return (
      <LoadingMessage>
        <Trans>Summary Cards</Trans>
      </LoadingMessage>
    )
  }

  return (
    <SimpleGrid
      columns={[1, 1, 1, 2]}
      spacing="30px"
      justifyItems="center"
      maxWidth="width.60"
      mx="auto"
      p={['2', '8']}
    >
      <SummaryCard
        title={t`Web Configuration`}
        description={t`Web encryption settings summary`}
        categoryDisplay={{
          fail: {
            name: t`Non-compliant TLS`,
            color: colors.weak,
          },
          pass: {
            name: t`Policy compliant TLS`,
            color: colors.strong,
          },
        }}
        data={data.webSummary}
      />
      <SummaryCard
        title={t`Email Configuration`}
        description={t`Email security settings summary`}
        categoryDisplay={{
          pass: {
            name: t`Dmarc pass`,
            color: colors.strong,
          },
          fail: {
            name: t`Dmarc fail`,
            color: colors.weak,
          },
        }}
        data={data.mailSummary}
      />
    </SimpleGrid>
  )
}

SummaryGroup.propTypes = {
  title: string,
  description: string,
}
