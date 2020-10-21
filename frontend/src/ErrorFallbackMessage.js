import React from 'react'
import { Box, Divider, SimpleGrid, Stack, Text } from '@chakra-ui/core'
import { func, object } from 'prop-types'
import { Trans } from '@lingui/react'

export function ErrorFallbackMessage({ error }) {
  return (
    <Box
      bg="primary"
      color="gray.50"
      align="center"
      my="10"
      maxHeight={['100&%', '50%']}
    >
      <SimpleGrid columns={[1, 2]}>
        <Stack role="alert" my="5" mx="10">
          <Text fontSize="2xl" fontWeight="bold">
            <Trans>An error has occured.</Trans>
          </Text>
          <Divider borderColor="accent" borderWidth="1" w="20%" />
          <Text as="cite" fontSize="xl">
            <Trans>{error.message}</Trans>
          </Text>
        </Stack>
        <Stack my="5" mx="10">
          <Text fontWeight="bold" fontSize="2xl">
            <Trans>
              This component is currently unavailable. Try reloading the page.
            </Trans>
          </Text>
        </Stack>
      </SimpleGrid>
    </Box>
  )
}

ErrorFallbackMessage.propTypes = {
  error: object,
  resetErrorBoundary: func,
}
