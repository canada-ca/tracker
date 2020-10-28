import React from 'react'
import { Trans, t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
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
  const { i18n } = useLingui()
  const toast = useToast()

  const { loading, error, data } = useQuery(WEB_AND_EMAIL_SUMMARIES, {
    onError: ({ message }) => {
      toast({
        title: 'Error',
        description: message,
        status: 'failure',
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
        title={i18n._(t`Web Configuration`)}
        description={i18n._(t`Web encryption settings summary`)}
        categoryDisplay={{
          'full-fail': {
            name: i18n._(t`Non-compliant TLS`),
            color: colors.weak,
          },
          'partial-pass': {
            name: i18n._(t`Partially TLS`),
            color: colors.moderate,
          },
          'full-pass': {
            name: i18n._(t`Policy compliant TLS`),
            color: colors.strong,
          },
        }}
        data={data.webSummary}
      />
      <SummaryCard
        title={i18n._(t`Email Configuration`)}
        description={i18n._(t`Email security settings summary`)}
        categoryDisplay={{
          'full-pass': {
            name: i18n._(t`Dmarc pass`),
            color: colors.strong,
          },
          'partial-pass': {
            name: i18n._(t`Dmarc partial`),
            color: colors.moderate,
          },
          'full-fail': {
            name: i18n._(t`Dmarc fail`),
            color: colors.weak,
          },
        }}
        data={data.emailSummary}
      />
    </SimpleGrid>
  )
}

SummaryGroup.propTypes = {
  title: string,
  description: string,
}
