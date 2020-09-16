import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'
import { WelcomeMessage } from './WelcomeMessage'

export function LandingPage() {
  return (
    <Layout>
      {/* <Heading as="h1" mb="2">
        <Trans>Track Web Security Compliance</Trans>
      </Heading>
      <Text fontSize="lg">
        <Trans>
          Canadians rely on the Government of Canada to provide secure digital
          services. A new policy notice guides government websites to adopt good
          web security practices. Track how government sites are becoming more
          secure.
        </Trans>
      </Text> */}
      <WelcomeMessage />
      <SummaryGroup name="dashboard" />
      <Text>
        <Trans>
          *All data represented is mocked for demonstration purposes
        </Trans>
      </Text>
    </Layout>
  )
}
