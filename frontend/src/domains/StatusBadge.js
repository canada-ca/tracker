import React from 'react'
import { Stack, Text } from '@chakra-ui/react'
import { string } from 'prop-types'

import { StatusIcon } from '../components/StatusIcon'

export function StatusBadge({ text, status }) {
  return (
    <Stack
      align="center"
      flexDirection={{ base: 'row', md: 'column' }}
      justifyContent="space-between"
      spacing={0}
      mx={{ md: 2 }}
    >
      <Text
        fontWeight="bold"
        fontSize="sm"
        mb={{ base: 0, md: '2' }}
        mr={{ base: '2', md: 0 }}
      >
        {text}
      </Text>
      <StatusIcon status={status} />
    </Stack>
  )
}

StatusBadge.propTypes = {
  text: string.isRequired,
  status: string.isRequired,
}
