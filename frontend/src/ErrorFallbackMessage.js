import React from 'react'
import { Box, Divider, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { object } from 'prop-types'
import { Trans } from '@lingui/macro'

export function ErrorFallbackMessage({ error }) {
  return (
    <Box bg="gray.50" my="10" display="flex" alignItems="center">
      <SimpleGrid columns={[1, 2]} bg="primary" color="gray.50">
        <Stack role="alert" my="5" mx="10">
          <Text fontSize="2xl" fontWeight="bold">
            <Trans>An error has occurred.</Trans>
          </Text>
          <Divider borderColor="accent" borderWidth="1" w="20%" />
          <Text fontFamily="courier" fontSize="xl">
            {error.message}
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
}
