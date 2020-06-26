import React from 'react'
import { Badge, Box, Text, PseudoBox } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { useHistory } from 'react-router-dom'
import { bool, string } from 'prop-types'

export function UserCard({ userName, displayName, tfa, admin }) {
  const history = useHistory()
  return (
    <PseudoBox
      width="100%"
      display={{ md: 'flex' }}
      alignItems="center"
      onClick={() => {
        history.push({
          pathname: '/user',
          state: { detail: userName },
        })
      }}
      _hover={{ borderColor: 'gray.200', bg: 'gray.200' }}
      p="30px"
    >
      <Box flexShrink="0" minW="15%">
        <Text mt={1} fontSize="lg" fontWeight="semibold">
          {displayName}
        </Text>
      </Box>
      <Box flexShrink="0" ml={{ md: 4 }} mr={{ md: 4 }} minW="35%">
        <Text fontSize="lg" minW="10%">
          {userName}
        </Text>
      </Box>
      <Box flexShrink="0" ml={{ md: 4 }} mr={{ md: 4 }} minW="15%">
        <Badge variantColor={tfa ? 'green' : 'red'} minW="15%">
          <Trans>TwoFactor</Trans>
        </Badge>
        <Badge variantColor={admin ? 'green' : 'red'} ml="10px" mr={{ md: 4 }}>
          <Trans>Admin</Trans>
        </Badge>
      </Box>
      <Box flexShrink="0" ml={{ md: 4 }} mr={{ md: 4 }} mt={2} minW="15%"></Box>
    </PseudoBox>
  )
}

UserCard.propTypes = {
  displayName: string.isRequired,
  userName: string.isRequired,
  admin: bool.isRequired,
  tfa: bool.isRequired,
}
