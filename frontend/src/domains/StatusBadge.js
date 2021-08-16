import React from 'react'
import { Stack, Text } from '@chakra-ui/react'
import { CheckCircleIcon, InfoIcon, WarningIcon } from '@chakra-ui/icons'
import { string } from 'prop-types'

export function StatusBadge({ text, status }) {
  const generateStatusIcon = (status) => {
    let statusIcon
    if (status === 'PASS') {
      statusIcon = (
        <CheckCircleIcon color="strong" size="icons.sm" aria-label="passes" />
      )
    } else if (status === 'FAIL') {
      statusIcon = (
        <WarningIcon color="weak" size="icons.sm" aria-label="fails" />
      )
    } else {
      statusIcon = (
        <InfoIcon
          color="info"
          size="icons.sm"
          aria-label="Information not sufficient, please view guidance"
        />
      )
    }
    return statusIcon
  }

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
      {generateStatusIcon(status)}
    </Stack>
  )
}

StatusBadge.propTypes = {
  text: string.isRequired,
  status: string.isRequired,
}
