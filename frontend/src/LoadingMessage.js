import React from 'react'
import { Box, Stack, Text, Spinner } from '@chakra-ui/core'
import { any } from 'prop-types'
import { Trans } from '@lingui/macro'

export function LoadingMessage({ children }) {
  return (
    <Box my="10">
      <Stack isInline align="center">
        <Spinner color="primary2" />
        <Text fontWeight="bold" fontSize="xl">
          <Trans>Loading {children}...</Trans>
        </Text>
      </Stack>
    </Box>
  )
}

LoadingMessage.propTypes = {
  children: any,
}
