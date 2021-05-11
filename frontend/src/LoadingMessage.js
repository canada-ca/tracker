import React from 'react'
import { Stack, Text, Spinner } from '@chakra-ui/core'
import { any } from 'prop-types'
import { Trans } from '@lingui/macro'

export function LoadingMessage({ children }) {
  return (
    <Stack align="center" my="10">
      <Stack isInline align="center">
        <Spinner
          size="lg"
          speed="0.6s"
          color="primary"
          emptyColor="accent"
          thickness="0.175em"
        />
        <Text fontWeight="bold" fontSize="3xl">
          <Trans>Loading {children}...</Trans>
        </Text>
      </Stack>
    </Stack>
  )
}

LoadingMessage.propTypes = {
  children: any,
}
