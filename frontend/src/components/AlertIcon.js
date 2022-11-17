import { Box, Text } from '@chakra-ui/react'
import { number, string } from 'prop-types'
import React from 'react'

export function AlertIcon({ number, status, ...props }) {
  let mutedColor = 'infoMuted'
  let color = 'info'
  switch (status) {
    case 'PASS':
      mutedColor = 'strongMuted'
      color = 'strong'
      break
    case 'FAIL':
      mutedColor = 'weakMuted'
      color = 'weak'
      break
  }

  return (
    <Box
      {...props}
      rounded="full"
      bg={mutedColor}
      w="2.25rem"
      borderWidth="2px"
      borderColor={color}
    >
      <Text textAlign="center" fontWeight="bold" p="1" color={color}>
        {number}
      </Text>
    </Box>
  )
}
AlertIcon.propTypes = {
  status: string,
  number: number,
}
