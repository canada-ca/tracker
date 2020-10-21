import React from 'react'
import { Box, Divider, SimpleGrid, Stack, Text } from '@chakra-ui/core'
import { func, object } from 'prop-types'

export function ErrorFallbackPage({ error }) {
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
            An error has occured.
          </Text>
          <Divider borderColor="accent" borderWidth="1" w="20%" />
          <Text as="cite" fontSize="xl">
            {error.message}
          </Text>
        </Stack>
        <Stack my="5" mx="10">
          <Text fontWeight="bold" fontSize="2xl">
            This component is currently unavailable. Try reloading the page.
          </Text>
        </Stack>
      </SimpleGrid>
    </Box>
  )
}

ErrorFallbackPage.propTypes = {
  error: object,
  resetErrorBoundary: func,
}
