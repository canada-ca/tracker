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
          <SummaryGroup name="dashboard" />
        </Stack>
      </Stack>
      <Text>
        <Trans>
          *All data represented is mocked for demonstration purposes
        </Trans>
      </Text>
    </Layout>
  )
}
