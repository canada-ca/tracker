import React from 'react'
import { Heading, Box, Text } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'

export default function PageNotFound() {
  return (
    <Box>
      <Heading as="h1">
        <Trans>Page not found</Trans>
      </Heading>
      <Text textAlign="center">
        <Trans>Sorry, the page you were trying to view does not exist.</Trans>
      </Text>
    </Box>
  )
}
