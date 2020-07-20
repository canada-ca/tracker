import React from 'react'
import { Badge, Box, Text, PseudoBox, Select, Stack } from '@chakra-ui/core'
import { Trans } from '@lingui/macro'
import { useHistory } from 'react-router-dom'
import { bool, string, func } from 'prop-types'

export function UserCard({ userName, displayName, tfa, role }) {
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
      {role && (
        <Box flexShrink="0" ml={{ md: 4 }} mr={{ md: 4 }} minW="35%">
          <Stack isInline align="center">
            <Text fontWeight="bold">
              <Trans>Role: </Trans>
            </Text>
            <Text fontSize="lg" minW="10%">
              {role}
            </Text>
            <Badge variantColor={tfa ? 'green' : 'red'} minW="15%">
              <Trans>TwoFactor</Trans>
            </Badge>
          </Stack>
        </Box>
      )}
    </PseudoBox>
  )
}

UserCard.propTypes = {
  displayName: string.isRequired,
  userName: string.isRequired,
  role: string,
  tfa: bool,
}
