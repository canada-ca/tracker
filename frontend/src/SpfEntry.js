import React from 'react'
import { Box, Divider, Stack, Text } from '@chakra-ui/core'
import { bool, string } from 'prop-types'

export function SpfEntry(props) {
  return (
    <Box>
      <Stack isInline>
        <Text fontSize="md" fontWeight="semibold">
          Domain:
        </Text>
        <Text fontSize="md">{props.domain}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="md" fontWeight="semibold">
          Scope:
        </Text>
        <Text fontSize="md">{props.scope}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="md" fontWeight="semibold">
          Result:
        </Text>
        <Text fontSize="md">{props.result}</Text>
      </Stack>

      <Divider />
    </Box>
  )
}

SpfEntry.propTypes = {
  domain: string.isRequired,
  scope: string.isRequired,
  result: bool.isRequired,
}
