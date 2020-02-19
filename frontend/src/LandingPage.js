import React from 'react'
import { Trans } from '@lingui/macro'
import { Layout } from './Layout'
import { Heading, Text, Stack } from '@chakra-ui/core'

export function LandingPage() {
  return (
    <Layout>
      <Stack spacing={10} shouldWrapChildren>
        <Heading as="h1">
          <Trans>Track web security compliance</Trans>
        </Heading>
        <Stack spacing={4}>
          <Stack spacing={4} direction="row" flexWrap="wrap">
            <Text>
              <Trans>
                Canadians rely on the Government of Canada to provide secure
                digital services. A new policy notice guides government websites
                to adopt good web security practices. Track how government sites
                are becoming more secure.
              </Trans>
            </Text>
          </Stack>
        </Stack>
      </Stack>
    </Layout>
  )
}
