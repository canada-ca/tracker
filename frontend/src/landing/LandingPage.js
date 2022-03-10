import React from 'react'
import { Heading, Stack } from '@chakra-ui/react'
import { Trans } from '@lingui/macro'

import { LandingPageSummaries } from './LandingPageSummaries'

export function LandingPage() {
  return (
    <Stack w="100%">
      <Heading as="h1" mb="16" textAlign="left">
        <Trans>Track Digital Security</Trans>
      </Heading>
      {document.location.origin !== 'https://tracker.alpha.canada.ca' && (
        <LandingPageSummaries />
      )}
    </Stack>
  )
}
