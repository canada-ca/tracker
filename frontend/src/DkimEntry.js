import React from 'react'
import { Box, Divider, Stack, Text } from '@chakra-ui/react'
import { bool, string } from 'prop-types'

export function DkimEntry(props) {
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
          Selector:
        </Text>
        <Text fontSize="md">{props.selector}</Text>
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

DkimEntry.propTypes = {
  domain: string.isRequired,
  selector: string.isRequired,
  result: bool.isRequired,
}
