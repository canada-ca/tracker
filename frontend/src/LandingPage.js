import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Text, Image, Stack } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'
import { WelcomeMessage } from './WelcomeMessage'

export function LandingPage() {
  return (
    <Layout>
      <Stack align="center">
        <Image
          src="src/images/tracker-logo-transparent.png"
          size={['100%', '0%']}
        />
        <WelcomeMessage />
      </Stack>

      <SummaryGroup name="dashboard" />
      <Text>
        <Trans>
          *All data represented is mocked for demonstration purposes
        </Trans>
      </Text>
    </Layout>
  )
}
