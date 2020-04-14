import React from 'react'
import { Box, Stack, Text, Divider } from '@chakra-ui/core'
import { string, bool } from 'prop-types'

export default function SpfEntry(props) {
  return (
    <Box>
      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Domain:
        </Text>
        <Text fontSize="xl">{props.domain}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Scope:
        </Text>
        <Text fontSize="xl">{props.scope}</Text>
      </Stack>

      <Stack isInline>
        <Text fontSize="xl" fontWeight="semibold">
          Result:
        </Text>
        <Text fontSize="xl">{props.result}</Text>
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
