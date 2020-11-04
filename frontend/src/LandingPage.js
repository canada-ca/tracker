import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Text, Image, Stack } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'
import trackerLogo from './images/tracker_v-03.png'
import { WelcomeMessage } from './WelcomeMessage'
import { ErrorBoundary } from 'react-error-boundary'
import { ErrorFallbackMessage } from './ErrorFallbackMessage'


export function LandingPage() {
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
        <SummaryGroup name="dashboard" />
        <Text>
          <Trans>
            *All data represented is mocked for demonstration purposes
          </Trans>
        </Text>
      </ErrorBoundary>
    </Layout>
  )
}
