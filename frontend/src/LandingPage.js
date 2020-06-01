import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack } from '@chakra-ui/core'
import { SummaryGroup } from './SummaryGroup'

export function LandingPage() {
  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Track Web Security Compliance</Trans>
        </Heading>
        <Stack spacing={4}>
          <Stack spacing={4} direction="row" flexWrap="wrap">
            <Text fontSize="lg">
              <Trans>
                Canadians rely on the Government of Canada to provide secure
                digital services. A new policy notice guides government websites
                to adopt good web security practices. Track how government sites
                are becoming more secure.
              </Trans>
            </Text>
          </Stack>
        </Stack>
        <Stack align="center">
          <SummaryGroup
            name="dashboard"
            title="Dashboard Overview"
            description="Web and email security configuration of top properties"
          />
          <SummaryGroup
            name="web"
            title="Web Security Overview"
            description="Key aspects of web application security of the hosts monitored by this dashboard."
          />
          <SummaryGroup
            name="email"
            title="Email Security Overview"
            description="Key aspects of email security of the hosts monitored by this dashboard."
          />
        </Stack>
      </Stack>
      <Text>
        *All data represented in charts is mocked for demonstration purposes
      </Text>
    </Layout>
  )
}
