import React from 'react'
import { Box, Stack, Text, Divider } from '@chakra-ui/core'
import { string } from 'prop-types'

export default function DkimEntry(props) {
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
          Selector:
        </Text>
        <Text fontSize="xl">{props.selector}</Text>
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

DkimEntry.propTypes = {
  domain: string.isRequired,
  selector: string.isRequired,
  result: string.isRequired,
}
