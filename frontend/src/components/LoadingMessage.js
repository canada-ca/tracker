import React from 'react'
import { Spinner, Stack, Text } from '@chakra-ui/react'
import { any } from 'prop-types'
import { Trans } from '@lingui/macro'

export function LoadingMessage({ children }) {
  return (
    <Stack align="center" layerStyle="loadingMessage">
      <Stack isInline align="center">
        <Spinner
          size="lg"
          speed="0.6s"
          color="primary"
          emptyColor="accent"
          thickness="0.175em"
        />
        <Text>
          <Trans>Loading {children}...</Trans>
        </Text>
      </Stack>
    </Stack>
  )
}

LoadingMessage.propTypes = {
  children: any,
}
