import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Image, Stack, useToast } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'
import trackerLogo from './images/tracker_v-03.png'
import { WelcomeMessage } from './WelcomeMessage'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'
import { useQuery } from '@apollo/client'
import { WEB_AND_EMAIL_SUMMARIES } from './graphql/queries'
import { LoadingMessage } from './LoadingMessage'

export function LandingPage() {
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
    <Layout>
      <Stack align="center">
        <Image
          src={trackerLogo}
          alt={'Tracker Logo'}
          size={['100%', '100%', '0%', '0%', '0%']}
        />
        <WelcomeMessage />
      </Stack>
      <ErrorBoundary FallbackComponent={ErrorFallbackMessage}>
        <SummaryGroup web={data.webSummary} mail={data.mailSummary} />
      </ErrorBoundary>
    </Layout>
  )
}
